use std::env;
use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder, Position, PhysicalPosition, Listener, TitleBarStyle};
use tauri_plugin_deep_link::DeepLinkExt;

// Add tray imports
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::image::Image;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};

// Add image crate for PNG decoding
use image;

#[tauri::command]
fn show_window(window: tauri::Window) -> Result<(), String> {
    // Always target the main window specifically, not the calling window
    let app_handle = window.app_handle();
    let main_window = match app_handle.get_webview_window("main") {
        Some(window) => window,
        None => {
            return Err("Main window not found".to_string());
        }
    };

    // Re-enable shadow on macOS
    // if let Err(e) = main_window.set_shadow(true) {
    //     eprintln!("Failed to set shadow: {}", e);
    // }

    main_window
        .show()
        .map_err(|e| format!("Failed to show window: {}", e))?;
    main_window
        .set_focus()
        .map_err(|e| format!("Failed to set focus: {}", e))?;

    Ok(())
}

fn toggle_search_window(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let search_window_label = "search";

    if let Some(window) = app.get_webview_window(search_window_label) {
        if window.is_visible()? {
            // Emit close event to search window
            let _ = window.emit("search-window-open", false);
            window.hide()?;
        } else {
            // Set always on top when showing
            window.set_always_on_top(true)?;
            position_window_on_current_monitor(app, &window)?;
            window.show()?;
            window.set_focus()?;  // Focus the window so it can detect focus loss
            
            // Emit open event to search window
            let _ = window.emit("search-window-open", true);
        }
    }

    Ok(())
}

fn position_window_on_current_monitor(app: &tauri::AppHandle, window: &tauri::WebviewWindow) -> Result<(), Box<dyn std::error::Error>> {
    // Get cursor position to determine current monitor
    if let Ok(cursor_position) = app.cursor_position() {
        // Get all monitors
        if let Ok(monitors) = app.available_monitors() {
            // Find which monitor contains the cursor
            let current_monitor = monitors.iter().find(|monitor| {
                let pos = monitor.position();
                let size = monitor.size();
                cursor_position.x >= pos.x as f64 
                    && cursor_position.x < (pos.x + size.width as i32) as f64
                    && cursor_position.y >= pos.y as f64 
                    && cursor_position.y < (pos.y + size.height as i32) as f64
            });

            if let Some(monitor) = current_monitor {
                let monitor_size = monitor.size();
                let monitor_position = monitor.position();
                
                // Get the actual window size to ensure accurate centering
                let window_size = window.outer_size().unwrap_or(tauri::PhysicalSize { width: 720, height: 450 });
                
                // Calculate center position on the monitor with slight offset for system UI
                let center_x = monitor_position.x + (monitor_size.width as i32 / 2) - (window_size.width as i32 / 2);
                let center_y = monitor_position.y + (monitor_size.height as i32 / 2) - (window_size.height as i32 / 2);
                
                // Adjust for macOS menu bar (typically 25-30px) and other system UI
                let center_y = center_y + 15; // Slight downward adjustment for menu bar
                
                window.set_position(Position::Physical(PhysicalPosition {
                    x: center_x,
                    y: center_y,
                }))?;
                
                return Ok(());
            }
        }
    }
    
    // Fallback to default center if monitor detection fails
    window.center()?;
    Ok(())
}

async fn create_preloaded_search_window(app: &tauri::AppHandle, app_url: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let search_window_label = "search";
    let search_url = format!("{}/desktop/search", app_url);

    let mut search_builder = WebviewWindowBuilder::new(
        app,
        search_window_label,
        WebviewUrl::External(tauri::Url::parse(&search_url)?),
    )
    .title("Midday Search")
    .inner_size(720.0, 450.0)
    .min_inner_size(720.0, 450.0)
    .resizable(false)
    .user_agent("Mozilla/5.0 (compatible; Midday Desktop App)")
    .transparent(true)
    .decorations(false)
    .visible(false)  // Start hidden for preloading
    .on_download(|_window, _event| {
        println!("Search window download triggered!");
        // Allow downloads from search window too
        true
    });

    // Platform-specific styling
    search_builder = search_builder
        .hidden_title(true)
        .title_bar_style(TitleBarStyle::Overlay);

    let search_window = search_builder
        .shadow(false)
        .build()?;

    // Position window on primary monitor (will be repositioned when shown)
    search_window.center()?;

    // Listen for close requests from frontend (e.g., ESC key)
    let window_for_close = search_window.clone();
    search_window.listen("search-window-close-requested", move |_event| {
        // Emit close event to search window
        let _ = window_for_close.emit("search-window-open", false);
        // Turn off always on top and hide
        let _ = window_for_close.set_always_on_top(false);
        let _ = window_for_close.hide();
    });

    // Handle window events - comprehensive auto-hide behavior
    let window_clone = search_window.clone();
    search_window.on_window_event(move |event| {
        match event {
            // Main case: window loses focus (click outside anywhere)
            tauri::WindowEvent::Focused(false) => {
                // Emit close event to search window
                let _ = window_clone.emit("search-window-open", false);
                // Turn off always on top and hide
                let _ = window_clone.set_always_on_top(false);
                let _ = window_clone.hide();
            }
            // Additional safety: if window somehow becomes invisible but should be hidden
            tauri::WindowEvent::Resized(_) | tauri::WindowEvent::Moved(_) => {
                // Check if still focused after these events, if not, hide
                if let Ok(false) = window_clone.is_focused() {
                    let _ = window_clone.emit("search-window-open", false);
                    let _ = window_clone.set_always_on_top(false);
                    let _ = window_clone.hide();
                }
            }
            _ => {}
        }
    });

    Ok(())
}

fn get_app_url() -> String {
    let env = env::var("MIDDAY_ENV").unwrap_or_else(|_| "development".to_string());

    match env.as_str() {
        "development" | "dev" => "http://localhost:3001".to_string(),
        "staging" => "https://beta.midday.ai".to_string(),
        "production" | "prod" => "https://app.midday.ai".to_string(),
        _ => {
            eprintln!("Unknown environment: {}, defaulting to development", env);
            "http://localhost:3001".to_string()
        }
    }
}

fn is_external_url(url: &str, app_url: &str) -> bool {
    // Parse both URLs to compare domains
    if let (Ok(target_url), Ok(base_url)) = (tauri::Url::parse(url), tauri::Url::parse(app_url)) {
        // Check if schemes are http/https
        let is_http_scheme = target_url.scheme() == "http" || target_url.scheme() == "https";

        // Check if it's a different domain/host
        let is_different_host = target_url.host() != base_url.host();

        return is_http_scheme && is_different_host;
    }
    false
}

fn handle_deep_link_event(app_handle: &tauri::AppHandle, urls: Vec<String>) {
    for url in &urls {
        if url.starts_with("midday://") {
            // Extract the path from the deep link
            let path = url.strip_prefix("midday://").unwrap_or("");

            // Remove any leading slashes
            let clean_path = path.trim_start_matches('/');

            // Get the main window and emit navigation event to frontend
            if let Some(window) = app_handle.get_webview_window("main") {
                // Emit event to frontend with just the path - frontend handles the full URL construction
                if let Ok(_) = window.emit("deep-link-navigate", clean_path) {
                    // Bring the window to front
                    let _ = window.set_focus();
                }
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_url = get_app_url();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        .invoke_handler(tauri::generate_handler![show_window])
        .setup(move |app| {
            let app_url_clone = app_url.clone();
            let app_handle = app.handle().clone();

            // Clone app_handle before it gets moved into closures
            let app_handle_for_deep_links = app_handle.clone();
            let app_handle_for_navigation = app_handle.clone();
            let app_handle_for_search = app_handle.clone();
            let app_handle_for_tray = app_handle.clone();

            // Initialize global shortcuts
            {
                use tauri_plugin_global_shortcut::{
                    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState,
                };

                let search_shortcut =
                    Shortcut::new(Some(Modifiers::SHIFT | Modifiers::ALT), Code::KeyK);

                if let Ok(_) = app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_handler(move |_app, shortcut, event| {
                            if shortcut == &search_shortcut
                                && event.state() == ShortcutState::Pressed
                            {
                                let _ = toggle_search_window(&app_handle_for_search);
                            }
                        })
                        .build(),
                ) {
                    let _ = app.global_shortcut().register(search_shortcut);
                }
            }

            // Register deep links at runtime for development
            #[cfg(debug_assertions)]
            {
                let _ = app_handle.deep_link().register_all();
            }

            // Handle deep link events
            app_handle.deep_link().on_open_url(move |event| {
                let url_strings: Vec<String> =
                    event.urls().iter().map(|url| url.to_string()).collect();
                handle_deep_link_event(&app_handle_for_deep_links, url_strings);
            });

            let win_builder = WebviewWindowBuilder::new(
                app,
                "main",
                WebviewUrl::External(tauri::Url::parse(&app_url).unwrap()),
            )
            .title("Midday")
            .inner_size(1450.0, 900.0)
            .min_inner_size(1450.0, 900.0)
            .user_agent("Mozilla/5.0 (compatible; Midday Desktop App)")
            .decorations(false)
            .visible(false)
            .transparent(true)
            .shadow(false)
            .hidden_title(true)
            .title_bar_style(TitleBarStyle::Overlay)
            .on_download(|_window, _event| {
                println!("Download triggered!");
                // Allow all downloads - they will go to default Downloads folder
                true
            })
            .on_navigation(move |url| {
                let url_str = url.as_str();

                // Check if this is an external URL
                if is_external_url(url_str, &app_url_clone) {
                    // Clone the URL string to avoid lifetime issues
                    let url_string = url_str.to_string();
                    let app_handle_clone = app_handle_for_navigation.clone();

                    // Open in system browser using the opener plugin
                    tauri::async_runtime::spawn(async move {
                        let _ = tauri_plugin_opener::OpenerExt::opener(&app_handle_clone)
                                .open_url(url_string, None::<String>);
                    });

                    // Prevent navigation in webview
                    return false;
                }

                // Allow internal navigation
                true
            });

            let window = win_builder.build().unwrap();

            // Fallback timer to ensure main window shows on first launch
            let window_clone = window.clone();
            tauri::async_runtime::spawn(async move {
                std::thread::sleep(std::time::Duration::from_secs(2));

                // Check if window is still hidden after 2 seconds
                if let Ok(is_visible) = window_clone.is_visible() {
                    if !is_visible {
                        let _ = window_clone.show();
                        let _ = window_clone.set_focus();
                    }
                }
            });

            // Preload search window for instant access
            let app_url_for_search = app_url.clone();
            let app_handle_for_preload = app_handle.clone();
            tauri::async_runtime::spawn(async move {
                // Small delay to let main window initialize first
                std::thread::sleep(std::time::Duration::from_millis(500));
                
                let _ = create_preloaded_search_window(&app_handle_for_preload, &app_url_for_search).await;
            });

            // Setup simple system tray for search toggle only
            // Load custom tray icon
            let tray_icon = {
                let icon_bytes = include_bytes!("../icons/tray-icon.png");
                // For now, let's decode the PNG to get RGBA data and dimensions
                // This is a simplified approach - you might need to add the `image` crate to Cargo.toml
                let img = image::load_from_memory(icon_bytes).map_err(|e| format!("Failed to load tray icon: {}", e))?;
                let rgba = img.to_rgba8();
                let (width, height) = rgba.dimensions();
                Image::new_owned(rgba.into_raw(), width, height)
            };

            // Create tray context menu
            let show_item = MenuItem::with_id(app, "show", "Open Midday", true, None::<&str>)?;
            let search_item = MenuItem::with_id(app, "search", "Open Search\tShift+Alt+K", true, None::<&str>)?;
            let separator1 = PredefinedMenuItem::separator(app)?;
            let updates_item = MenuItem::with_id(app, "updates", "Check for Updates", true, None::<&str>)?;
            let separator2 = PredefinedMenuItem::separator(app)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            let menu = Menu::with_items(app, &[
                &show_item,
                &search_item,
                &separator1,
                &updates_item,
                &separator2,
                &quit_item,
            ])?;

            // Clone app handle for menu events
            let app_handle_for_menu = app_handle.clone();

            let _tray = TrayIconBuilder::new()
                .icon(tray_icon)
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(move |_tray, event| {
                    match event.id().as_ref() {
                        "show" => {
                            // Show main window
                            if let Some(main_window) = app_handle_for_menu.get_webview_window("main") {
                                let _ = main_window.show();
                                let _ = main_window.set_focus();
                            }
                        }
                        "search" => {
                            // Toggle search window
                            let _ = toggle_search_window(&app_handle_for_menu);
                        }
                        "updates" => {
                            // Placeholder for future update functionality
                            println!("Check for updates clicked - feature to be implemented");
                            // TODO: Implement update checking functionality
                        }
                        "quit" => {
                            // Actually quit the application
                            std::process::exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(move |_tray, event| {
                    // Handle left clicks to toggle search window (keep existing behavior)
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let _ = toggle_search_window(&app_handle_for_tray);
                    }
                })
                .build(app)?;

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri app")
        .run(|app_handle, event| match event {
            tauri::RunEvent::Reopen { .. } => {
                if let Some(main_window) = app_handle.get_webview_window("main") {
                    let _ = main_window.show();
                    let _ = main_window.set_focus();
                }
            }
            tauri::RunEvent::ExitRequested { api, .. } => {
                // Prevent app from quitting to keep global shortcuts working
                api.prevent_exit();
                
                // Hide all windows instead of quitting
                if let Some(main_window) = app_handle.get_webview_window("main") {
                    let _ = main_window.hide();
                }
                if let Some(search_window) = app_handle.get_webview_window("search") {
                    let _ = search_window.hide();
                }
            }
            _ => {}
        });
} 