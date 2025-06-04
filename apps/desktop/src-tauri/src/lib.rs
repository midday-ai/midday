use std::env;
use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder, Position, PhysicalPosition};
use tauri_plugin_deep_link::DeepLinkExt;

#[cfg(target_os = "macos")]
use tauri::TitleBarStyle;

// Add tray imports
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};

#[tauri::command]
fn show_window(window: tauri::Window) -> Result<(), String> {
    println!("📄 Show window command called");

    // Always target the main window specifically, not the calling window
    let app_handle = window.app_handle();
    let main_window = match app_handle.get_webview_window("main") {
        Some(window) => window,
        None => {
            return Err("Main window not found".to_string());
        }
    };

    // Configure window properly before showing
    #[cfg(not(target_os = "macos"))]
    {
        if let Err(e) = main_window.set_decorations(true) {
            eprintln!("Failed to set decorations: {}", e);
        }
    }

    #[cfg(target_os = "macos")]
    {
        // Re-enable shadow on macOS
        if let Err(e) = main_window.set_shadow(true) {
            eprintln!("Failed to set shadow: {}", e);
        }
    }

    main_window
        .show()
        .map_err(|e| format!("Failed to show window: {}", e))?;
    main_window
        .set_focus()
        .map_err(|e| format!("Failed to set focus: {}", e))?;

    println!("✅ Main window shown and focused");
    Ok(())
}

fn toggle_search_window(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let search_window_label = "search";

    // Check if search window already exists
    if let Some(window) = app.get_webview_window(search_window_label) {
        // Window exists, check if it's visible
        match window.is_visible() {
            Ok(is_visible) => {
                if is_visible {
                    // Window is visible, hide it
                    println!("🔍 Search window is visible, hiding it");
                    window.hide()?;
                } else {
                    // Window exists but is hidden, show and focus it on current monitor
                    println!("🔍 Search window is hidden, showing it on current monitor");
                    position_window_on_current_monitor(app, &window)?;
                    window.show()?;
                }
            }
            Err(e) => {
                eprintln!("⚠️ Failed to check window visibility: {}", e);
                // Fallback: try to show the window
                position_window_on_current_monitor(app, &window)?;
                window.show()?;
            }
        }
        return Ok(());
    }

    // Window doesn't exist, create it
    create_new_search_window(app)
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
                #[cfg(target_os = "macos")]
                let center_y = center_y + 15; // Slight downward adjustment for menu bar
                
                window.set_position(Position::Physical(PhysicalPosition {
                    x: center_x,
                    y: center_y,
                }))?;
                
                println!("✅ Positioned search window on monitor {}x{} at center ({}, {}) with window size {}x{}", 
                    monitor_size.width, monitor_size.height, center_x, center_y, 
                    window_size.width, window_size.height);
                return Ok(());
            }
        }
    }
    
    // Fallback to default center if monitor detection fails
    window.center()?;
    println!("⚠️ Using fallback center positioning");
    Ok(())
}

fn create_new_search_window(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let search_window_label = "search";
    let app_url = get_app_url();
    let search_url = format!("{}/desktop/search", app_url);

    println!("🔍 Creating search window with URL: {}", search_url);

    let mut search_builder = WebviewWindowBuilder::new(
        app,
        search_window_label,
        WebviewUrl::External(tauri::Url::parse(&search_url)?),
    )
    .title("Midday Search")
    .inner_size(720.0, 450.0)
    .min_inner_size(720.0, 450.0)
    .resizable(true)
    .user_agent("Mozilla/5.0 (compatible; Midday Desktop App)")
    .transparent(true)
    .decorations(false);  // Secondary window - not always on top

    // Platform-specific styling
    #[cfg(target_os = "macos")]
    {
        search_builder = search_builder
            .hidden_title(true)
            .title_bar_style(TitleBarStyle::Overlay);
    }

    let search_window = search_builder
        .shadow(false)
        .build()?;

    // Position window on current monitor
    position_window_on_current_monitor(app, &search_window)?;

    // Handle window events - simplified auto-hide behavior
    let window_clone = search_window.clone();
    let app_handle_clone = app.clone();
    search_window.on_window_event(move |event| {
        if let tauri::WindowEvent::Focused(false) = event {
            // Search window lost focus - auto-hide if main window is visible
            if let Some(main_window) = app_handle_clone.get_webview_window("main") {
                if main_window.is_visible().unwrap_or(false) {
                    // Main window is visible, safe to auto-hide search
                    println!("🔍 Search window lost focus, hiding (main window is visible)");
                    if let Err(e) = window_clone.hide() {
                        eprintln!("⚠️ Failed to hide search window: {}", e);
                    }
                } else {
                    // Main window is hidden, keep search visible
                    println!("🔍 Search window lost focus but main is hidden - keeping visible");
                }
            }
        }
    });

    // Don't show the window automatically - let toggle function handle visibility
    // search_window.show()?;

    println!("✅ Search window created (hidden)");
    Ok(())
}

async fn create_preloaded_search_window(app: &tauri::AppHandle, app_url: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let search_window_label = "search";
    let search_url = format!("{}/desktop/search", app_url);

    println!("🔍 Preloading search window with URL: {}", search_url);

    let mut search_builder = WebviewWindowBuilder::new(
        app,
        search_window_label,
        WebviewUrl::External(tauri::Url::parse(&search_url)?),
    )
    .title("Midday Search")
    .inner_size(720.0, 450.0)
    .min_inner_size(720.0, 450.0)
    .resizable(true)
    .user_agent("Mozilla/5.0 (compatible; Midday Desktop App)")
    .transparent(true)
    .decorations(false)
    .visible(false);  // Start hidden for preloading

    // Platform-specific styling
    #[cfg(target_os = "macos")]
    {
        search_builder = search_builder
            .hidden_title(true)
            .title_bar_style(TitleBarStyle::Overlay);
    }

    let search_window = search_builder
        .shadow(false)
        .build()?;

    // Position window on primary monitor (will be repositioned when shown)
    search_window.center()?;

    // Handle window events - simplified auto-hide behavior
    let window_clone = search_window.clone();
    let app_handle_clone = app.clone();
    search_window.on_window_event(move |event| {
        if let tauri::WindowEvent::Focused(false) = event {
            // Search window lost focus - auto-hide if main window is visible
            if let Some(main_window) = app_handle_clone.get_webview_window("main") {
                if main_window.is_visible().unwrap_or(false) {
                    // Main window is visible, safe to auto-hide search
                    println!("🔍 Search window lost focus, hiding (main window is visible)");
                    if let Err(e) = window_clone.hide() {
                        eprintln!("⚠️ Failed to hide search window: {}", e);
                    }
                } else {
                    // Main window is hidden, keep search visible
                    println!("🔍 Search window lost focus but main is hidden - keeping visible");
                }
            }
        }
    });

    // Window is created and hidden, ready for instant access
    println!("✅ Search window preloaded (hidden)");
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
    let app_url = get_app_url();

    for url in &urls {
        println!("🔗 Deep link received: {}", url);

        if url.starts_with("midday://") {
            // Extract the path from the deep link
            let path = url.strip_prefix("midday://").unwrap_or("");

            // Remove any leading slashes
            let clean_path = path.trim_start_matches('/');

            // Construct the full URL for logging
            let navigation_url = if clean_path.is_empty() {
                app_url.clone()
            } else {
                format!("{}/{}", app_url, clean_path)
            };

            println!("🎯 Attempting to navigate webview to: {}", navigation_url);
            println!("📤 Emitting path to frontend: '{}'", clean_path);

            // Get the main window and emit navigation event to frontend
            match app_handle.get_webview_window("main") {
                Some(window) => {
                    println!("✅ Found main window");

                    // Emit event to frontend with just the path - frontend handles the full URL construction
                    match window.emit("deep-link-navigate", clean_path) {
                        Ok(_) => {
                            println!(
                                "✅ Successfully emitted navigation event to frontend with path: '{}'",
                                clean_path
                            );
                        }
                        Err(e) => {
                            eprintln!("❌ Failed to emit navigation event: {}", e);
                        }
                    }

                    // Bring the window to front
                    match window.set_focus() {
                        Ok(_) => {
                            println!("✅ Successfully focused window");
                        }
                        Err(e) => {
                            eprintln!("⚠️ Failed to focus window: {}", e);
                        }
                    }
                }
                None => {
                    eprintln!("❌ Could not find main window!");

                    // Debug: List all available windows
                    let all_windows = app_handle.webview_windows();
                    println!("Available windows:");
                    for (label, _window) in all_windows.iter() {
                        println!("  - {}", label);
                    }
                }
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_url = get_app_url();
    println!("🚀 Loading Midday from: {}", app_url);

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
            #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::{
                    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState,
                };

                let search_shortcut =
                    Shortcut::new(Some(Modifiers::SHIFT | Modifiers::ALT), Code::KeyK);
                    
                let show_main_shortcut =
                    Shortcut::new(Some(Modifiers::SHIFT | Modifiers::ALT), Code::KeyM);

                match app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_handler(move |_app, shortcut, event| {
                            if shortcut == &search_shortcut
                                && event.state() == ShortcutState::Pressed
                            {
                                println!("🔍 Global search shortcut triggered");
                                if let Err(e) =
                                    toggle_search_window(&app_handle_for_search)
                                {
                                    eprintln!("❌ Failed to toggle search window: {}", e);
                                }
                            } else if shortcut == &show_main_shortcut
                                && event.state() == ShortcutState::Pressed
                            {
                                println!("🏠 Global show main window shortcut triggered");
                                if let Some(main_window) = app_handle_for_search.get_webview_window("main") {
                                    if let Err(e) = main_window.show() {
                                        eprintln!("❌ Failed to show main window: {}", e);
                                    } else {
                                        if let Err(e) = main_window.set_focus() {
                                            eprintln!("⚠️ Failed to focus main window: {}", e);
                                        } else {
                                            println!("✅ Main window shown via global shortcut");
                                        }
                                    }
                                }
                            }
                        })
                        .build(),
                ) {
                    Ok(_) => {
                        // Register both shortcuts
                        match app.global_shortcut().register(search_shortcut) {
                            Ok(_) => {
                                println!("✅ Global search shortcut registered: Shift+Option+K");
                            }
                            Err(e) => {
                                eprintln!("⚠️ Failed to register search shortcut: {}", e);
                                #[cfg(target_os = "macos")]
                                eprintln!("💡 On macOS, please grant Accessibility permissions in System Preferences → Privacy & Security → Accessibility");
                            }
                        }
                        
                        match app.global_shortcut().register(show_main_shortcut) {
                            Ok(_) => {
                                println!("✅ Global show main window shortcut registered: Shift+Option+M");
                            }
                            Err(e) => {
                                eprintln!("⚠️ Failed to register show main shortcut: {}", e);
                                #[cfg(target_os = "macos")]
                                eprintln!("💡 On macOS, please grant Accessibility permissions in System Preferences → Privacy & Security → Accessibility");
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("⚠️ Failed to initialize global shortcut plugin: {}", e);
                        #[cfg(target_os = "macos")]
                        eprintln!("💡 On macOS, please grant Accessibility permissions in System Preferences → Privacy & Security → Accessibility");
                    }
                }
            }

            // Register deep links at runtime for development (Linux and Windows)
            #[cfg(any(target_os = "linux", all(debug_assertions, windows)))]
            {
                if let Err(e) = app_handle.deep_link().register_all() {
                    eprintln!("Failed to register deep links: {}", e);
                } else {
                    println!("✅ Deep links registered for development");
                }
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
            .transparent(true)
            .decorations(false)
            .visible(false)
            .shadow(false)
            .on_navigation(move |url| {
                let url_str = url.as_str();

                println!("🔗 Navigation attempt to: {}", url_str);

                // Check if this is an external URL
                if is_external_url(url_str, &app_url_clone) {
                    println!("🌐 Opening external URL in system browser: {}", url_str);

                    // Clone the URL string to avoid lifetime issues
                    let url_string = url_str.to_string();
                    let app_handle_clone = app_handle_for_navigation.clone();

                    // Open in system browser using the opener plugin
                    tauri::async_runtime::spawn(async move {
                        if let Err(e) =
                            tauri_plugin_opener::OpenerExt::opener(&app_handle_clone)
                                .open_url(url_string, None::<String>)
                        {
                            eprintln!("Failed to open URL in external browser: {}", e);
                        }
                    });

                    // Prevent navigation in webview
                    return false;
                }

                // Allow internal navigation
                println!("✅ Allowing internal navigation to: {}", url_str);
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
                        println!("⚠️ Main window still hidden after 2s, showing as fallback");
                        if let Err(e) = window_clone.show() {
                            eprintln!("Failed to show main window: {}", e);
                        } else {
                            if let Err(e) = window_clone.set_focus() {
                                eprintln!("Failed to focus main window: {}", e);
                            } else {
                                println!("✅ Main window shown via fallback timer");
                            }
                        }
                    }
                }
            });

            // Preload search window for instant access
            let app_url_for_search = app_url.clone();
            let app_handle_for_preload = app_handle.clone();
            tauri::async_runtime::spawn(async move {
                // Small delay to let main window initialize first
                std::thread::sleep(std::time::Duration::from_millis(500));
                
                if let Err(e) = create_preloaded_search_window(&app_handle_for_preload, &app_url_for_search).await {
                    eprintln!("⚠️ Failed to preload search window: {}", e);
                } else {
                    println!("✅ Search window preloaded and ready");
                }
            });

            // Setup simple system tray for search toggle only
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .on_tray_icon_event(move |_tray, event| {
                    // Handle clicks to toggle search window
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        println!("🔍 Tray clicked - toggling search window");
                        if let Err(e) = toggle_search_window(&app_handle_for_tray) {
                            eprintln!("❌ Failed to toggle search window from tray: {}", e);
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri app")
        .run(|app_handle, event| match event {
            #[cfg(target_os = "macos")]
            tauri::RunEvent::Reopen { .. } => {
                println!("🏠 Dock icon clicked - showing main window");
                if let Some(main_window) = app_handle.get_webview_window("main") {
                    if let Err(e) = main_window.show() {
                        eprintln!("❌ Failed to show main window: {}", e);
                    } else {
                        if let Err(e) = main_window.set_focus() {
                            eprintln!("⚠️ Failed to focus main window: {}", e);
                        } else {
                            println!("✅ Main window shown via dock activation");
                        }
                    }
                }
            }
            _ => {}
        });
}
