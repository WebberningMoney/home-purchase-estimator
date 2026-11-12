# 購屋財務評估 — 開發規則

- 技術：Tauri 2 + React + TypeScript + Vite。測試用 Vitest。
- 所有計算放 `src/core`，只能是純函式，不可碰畫面、檔案、網路。
- 畫面元件放 `src/components`，不寫計算公式，只呼叫 `core`。
- 註解與介面文字一律用白話繁體中文，只說「為什麼」，不重複程式碼在做什麼。
- 改公式時，同步更新 `tests/` 與 `docs/formulas.md`。
- 不留暫時性做法、重複命名、沒用到的程式碼。
- 真實財務數字不得進版本庫：`*.local.json` 已被忽略，範例資料只用虛構數字。
- 指令：`npm test`、`npm run typecheck`、`npm run build` 都要通過才算完成。

## git：開始工作前先設定（雲端沙盒的預設身分是 Claude，曾讓整排 commit 的作者變成 Claude、還被標成 Unverified）

```bash
git config core.hooksPath scripts/git-hooks
git config commit.gpgsign false
git config user.name  "$(git log -1 --format=%an origin/main)"
git config user.email "$(git log -1 --format=%ae origin/main)"
git config estimator.owneremail "$(git log -1 --format=%ae origin/main)"
```

- 作者與提交者一律是專案擁有者（Webber Huang）；AI 助理只寫在訊息最後的 `Co-Authored-By:`。
- 不簽章：沙盒的簽章金鑰沒登記在擁有者的 GitHub，會被標成 Unverified。
- `scripts/git-hooks/` 會在 commit 與 push 前擋下上面兩種情況。
- commit 訊息：英文標題（祈使句），空一行後條列這次改了什麼。
- 改寫歷史或強制推送前，一定要先問擁有者。
