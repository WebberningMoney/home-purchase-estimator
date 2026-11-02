// 正式版在 Windows 上不要跳出黑色命令列視窗
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    home_purchase_estimator_lib::run()
}
