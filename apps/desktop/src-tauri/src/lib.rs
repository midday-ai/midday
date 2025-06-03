use std::env;
use tauri::{WebviewUrl, WebviewWindowBuilder, Manager, Emitter};
use tauri_plugin_deep_link::DeepLinkExt;

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
                            println!("✅ Successfully emitted navigation event to frontend with path: '{}'", clean_path);
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
        .invoke_handler(tauri::generate_handler![])
        .setup(move |app| {
            let app_url_clone = app_url.clone();
            let app_handle = app.handle().clone();
            
            // Register deep links at runtime for development (Linux and Windows)
            // This ensures deep links work in development mode without requiring installation
            #[cfg(any(target_os = "linux", all(debug_assertions, windows)))]
            {
                if let Err(e) = app.deep_link().register_all() {
                    eprintln!("Failed to register deep links: {}", e);
                } else {
                    println!("✅ Deep links registered for development");
                }
            }
            
            // Handle deep link events
            let app_handle_clone = app_handle.clone();
            app.deep_link().on_open_url(move |event| {
                let url_strings: Vec<String> = event.urls().iter().map(|url| url.to_string()).collect();
                handle_deep_link_event(&app_handle_clone, url_strings);
            });
            
            let win_builder = WebviewWindowBuilder::new(
                app, 
                "main", 
                WebviewUrl::External(tauri::Url::parse(&app_url).unwrap())
            )
            .title("Midday")
            .inner_size(1450.0, 900.0)
            .min_inner_size(1450.0, 900.0)
            .decorations(false)
            .transparent(true)
            .user_agent("Mozilla/5.0 (compatible; Midday Desktop App)")
            .on_navigation(move |url| {
                let url_str = url.as_str();
                
                println!("🔗 Navigation attempt to: {}", url_str);
                
                // Check if this is an external URL
                if is_external_url(url_str, &app_url_clone) {
                    println!("🌐 Opening external URL in system browser: {}", url_str);
                    
                    // Clone the URL string to avoid lifetime issues
                    let url_string = url_str.to_string();
                    let app_handle_clone = app_handle.clone();
                    
                    // Open in system browser using the opener plugin
                    tauri::async_runtime::spawn(async move {
                        if let Err(e) = tauri_plugin_opener::OpenerExt::opener(&app_handle_clone).open_url(url_string, None::<String>) {
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

            let _window = win_builder.build().unwrap();
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
