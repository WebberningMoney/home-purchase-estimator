# 換屋財務評估 — 開發規則

- 技術：Tauri 2 + React + TypeScript + Vite。測試用 Vitest。
- 所有計算放 `src/core`，只能是純函式，不可碰畫面、檔案、網路。
- 畫面元件放 `src/components`，不寫計算公式，只呼叫 `core`。
- 註解與介面文字一律用白話繁體中文，只說「為什麼」，不重複程式碼在做什麼。
- 改公式時，同步更新 `tests/` 與 `docs/formulas.md`。
- 不留暫時性做法、重複命名、沒用到的程式碼。
- 真實財務數字不得進版本庫：`*.local.json` 已被忽略，範例資料只用虛構數字。
- 指令：`npm test`、`npm run typecheck`、`npm run build` 都要通過才算完成。
