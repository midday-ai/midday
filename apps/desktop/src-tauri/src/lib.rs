use std::env;
use tauri::{WebviewUrl, WebviewWindowBuilder, Manager};

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_url = get_app_url();
    println!("🚀 Loading Midday from: {}", app_url);

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![])
        .setup(move |app| {
            let app_url_clone = app_url.clone();
            let app_handle = app.handle().clone();
            
            let win_builder = WebviewWindowBuilder::new(
                app, 
                "main", 
                WebviewUrl::External(tauri::Url::parse(&app_url).unwrap())
            )
            .title("Midday")
            .inner_size(1450.0, 900.0)
            .min_inner_size(1450.0, 900.0)
            .decorations(false)
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
