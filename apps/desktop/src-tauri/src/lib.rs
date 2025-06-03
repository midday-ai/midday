use std::env;
use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_url = get_app_url();
    println!("Loading Midday from: {}", app_url);

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .setup(move |app| {
            let window = app.get_webview_window("main").unwrap();
            window.navigate(tauri::Url::parse(&app_url).unwrap()).unwrap();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
