/// 啟動視窗，並打開「存檔對話框、讀寫檔案、連網查匯率」三個功能
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .run(tauri::generate_context!())
        .expect("無法啟動換屋財務評估");
}
