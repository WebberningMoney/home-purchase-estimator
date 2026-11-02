# 購屋財務評估

Home Purchase Estimator

買房，錢夠不夠？不管是第一次買房、加買一間，還是賣掉舊屋再買新屋，都能用。拉動房價和利率，馬上知道買不買得起，也看得到存款每個月怎麼變。

資料只存在你的電腦，不會上傳。

## 怎麼用

1. 左邊拉「房價」「利率」「貸款成數」。拉桿底色就是答案：綠＝不耗用現金（無風險）、藍＝耗用現金（低風險）、黃＝耗用現金（中風險）、紅＝耗用現金（高風險）。藍色也包含「收入付得起貸款，但存不到你想存的金額」。
2. 右邊先看結論，再看「最多買得起」多少錢（同時列出綠、藍、黃三條房價界線）、存款每月的變化圖和重點數字。
3. 「家庭收支」可以新增、刪除收入來源（至少留一個），並在「風險門檻」設定緊急預備金（預設 6 個月）和風險分界：現金撐 36 個月以上算低風險、12～36 個月算中風險、不到 12 個月算高風險。
4. 想細調就展開「家庭收支」「資產」「現有貸款」「賣舊屋」。每個數字都可以直接打字。貸款只要填原始本金、起始日、年期、利率，剩餘本金和月繳金會自動算；利率有調整過，就在貸款卡片裡記一筆「利率調整」。
5. 有舊屋要賣：打開「賣舊屋」右上角的開關，並把舊屋的房貸填進「現有貸款」（類型選「舊屋房貸」），賣屋時它一定會被全部還清。沒有舊屋要賣（第一次買房，或舊屋留著不賣）就維持關閉，那一區不會被計算。
6. 「儲存檔案」存成檔案，「開啟檔案」再讀回來。平常改動也會自動記住。

一開始看到的是範例（兩人年收入 120 萬、資產 500 萬、一筆 100 萬信貸，想買 2,000 萬的新屋），數字是虛構的，按「重設」可以回到它。請換成自己的。

## 下載與開啟

直接下載做好的程式，不用裝任何開發工具。到 [Releases 頁面](https://github.com/WebberningMoney/home-purchase-estimator/releases) 找最新版，在「Assets」底下下載：

### Mac

1. 下載 `HomePurchaseEstimator-macOS-AppleSilicon.dmg`（適用 M1～M4 晶片的 Mac；Intel 的 Mac 請看下方「自己打包」）。
2. 雙擊打開，把「購屋財務評估」拖進「應用程式」資料夾。
3. 第一次開啟：因為沒有向 Apple 付費簽署，要在「應用程式」裡對它按右鍵 →「打開」→ 再按一次「打開」。之後就能正常雙擊。
4. 如果說「已損毀，無法打開」，打開「終端機」（`⌘ + 空白鍵` 搜尋），貼上這行再按 Enter，然後重新開啟：
   ```
   xattr -cr /Applications/購屋財務評估.app
   ```

### Windows

1. 下載 `HomePurchaseEstimator-Windows-x64.zip`。這是免安裝版，不會改動你的系統。
2. 在檔案上按右鍵 →「全部解壓縮」，放在你想放的地方（例如桌面）。
3. 雙擊裡面的 `HomePurchaseEstimator.exe`。
4. 第一次開啟會跳出藍色的「Windows 已保護您的電腦」，因為沒有向 Microsoft 付費簽署。按「**其他資訊**」→「**仍要執行**」即可，之後不會再問。
5. 如果打不開，或一閃就消失：電腦缺少 WebView2（Windows 11 和較新的 Windows 10 都已內建）。到 <https://developer.microsoft.com/microsoft-edge/webview2/> 下載「Evergreen 啟動程式」安裝，再重新開啟。

要刪除的話，把解壓縮出來的資料夾刪掉就好。你填的數字不會存在這個資料夾裡：平常自動記住的內容放在系統的使用者資料區，「儲存檔案」存出來的檔案則放在你選的位置。換電腦時，用「儲存檔案」帶走最方便。

## 自己打包

只有想自己改程式、或自己重新做安裝檔的人需要看這一章，只是要用的話請看上面。

### 為什麼要裝這些東西？

這個專案給你的是「食譜和食材」（原始碼），不是做好的成品。要先在自己的電腦上「煮」一次，才會變成可以點開的程式。煮的過程需要幾樣工具，裝一次就好。Mac 和 Windows 要裝的不同，各看自己那一節。

### Mac 打包

#### 要裝的工具

| 工具 | 它做什麼（比喻） | 怎麼裝 |
|---|---|---|
| Node.js | 把畫面的食材備齊、組裝起來（備料廚房） | 到 <https://nodejs.org> 下載 LTS 版安裝檔，一路按「繼續」。版本要 22 以上 |
| Rust | 把組好的畫面包成 Mac 視窗程式（包裝機） | 終端機貼上：`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh`，出現選單按 Enter，裝完把終端機關掉重開 |
| Xcode 命令列工具 | Mac 內建的基本零件，包裝機要用 | 終端機輸入：`xcode-select --install`，已經有的話會告訴你 |

「終端機」是 Mac 內建的程式，按 `⌘ + 空白鍵` 搜尋「終端機」就找得到。以下指令都貼在那裡，按 Enter 執行。

#### 第一次安裝

1. 檢查工具有沒有裝好（每行都應該印出版本號）：
   ```
   node -v
   rustc --version
   xcode-select -p
   ```
2. 把專案下載到桌面：
   ```
   cd ~/Desktop
   git clone https://github.com/WebberningMoney/home-purchase-estimator.git
   cd home-purchase-estimator
   ```
3. 下載需要的零件（約 1 分鐘）：
   ```
   npm install
   ```
4. 啟動程式。第一次要把 Rust 部分編譯一遍，約 5–10 分鐘，看到終端機一直跑字是正常的：
   ```
   npm run tauri dev
   ```
   完成後會跳出「購屋財務評估」視窗。

#### 之後每次使用

打開終端機，依序輸入（要先 `cd`，否則電腦不知道專案在哪）：

```
cd ~/Desktop/home-purchase-estimator
npm run tauri dev
```

想更新到最新版：先 `git pull`，再啟動。

#### 做成可以雙擊的程式

```
npm run tauri build
```

完成後到 `src-tauri/target/release/bundle/macos/` 找到「購屋財務評估.app」，拖進「應用程式」資料夾。第一次開啟的做法同上面「下載與開啟」。

### Windows 打包

#### 要裝的工具

| 工具 | 它做什麼（比喻） | 怎麼裝 |
|---|---|---|
| Git | 把專案下載下來 | 到 <https://git-scm.com/download/win> 下載安裝，一路按「Next」 |
| Node.js | 把畫面的食材備齊、組裝起來（備料廚房） | 到 <https://nodejs.org> 下載 LTS 版安裝檔，一路按「Next」。版本要 22 以上 |
| Visual Studio Build Tools | Windows 的基本零件，包裝機要用 | 到 <https://visualstudio.microsoft.com/visual-cpp-build-tools/> 下載安裝，勾選「**使用 C++ 的桌面開發**」，下載量大，約 10 分鐘 |
| Rust | 把組好的畫面包成 Windows 程式（包裝機） | 到 <https://rustup.rs> 下載 `rustup-init.exe`，執行後出現選單按 Enter。**要等 Build Tools 裝完再裝**，裝完把視窗關掉重開 |

以下指令都貼在「PowerShell」，按 `Windows 鍵` 搜尋「PowerShell」就找得到。

#### 第一次安裝

1. 檢查工具有沒有裝好（每行都應該印出版本號）：
   ```
   git --version
   node -v
   rustc --version
   ```
2. 把專案下載到桌面：
   ```
   cd $HOME\Desktop
   git clone https://github.com/WebberningMoney/home-purchase-estimator.git
   cd home-purchase-estimator
   ```
3. 下載需要的零件（約 1 分鐘）：
   ```
   npm install
   ```
4. 啟動程式。第一次要把 Rust 部分編譯一遍，約 5–10 分鐘：
   ```
   npm run tauri dev
   ```

#### 之後每次使用

```
cd $HOME\Desktop\home-purchase-estimator
npm run tauri dev
```

想更新到最新版：先 `git pull`，再啟動。

#### 做成免安裝的程式

```
npm run tauri build -- --no-bundle
```

完成後程式本體在 `src-tauri\target\release\home-purchase-estimator.exe`，單獨一個檔案就能用，複製到哪裡都可以。第一次開啟的做法同上面「下載與開啟」。

### 讓 GitHub 自動打包並發佈

不想在自己的電腦上打包的話，可以交給 GitHub：它會用雲端的 Mac 和 Windows 各打包一次，並放到 Releases 頁面。

- **正式發佈：** 在專案資料夾輸入下面兩行（版本號要和 `package.json` 的 `version` 一致），等幾分鐘，Releases 頁就會出現新版和下載檔。
  ```
  git tag v1.0.0
  git push origin v1.0.0
  ```
- **只想測試、不發佈：** 到 GitHub 專案頁的「Actions」→「打包 Mac 與 Windows 版」→「Run workflow」，跑完後在該次執行頁面最下方的「Artifacts」下載。檔案只保留 90 天。
- 自動打包的 Mac 版只有 Apple 晶片（M1～M4）。Intel 的 Mac 請用上面的方式在自己的電腦打包。

### 遇到問題

| 看到的訊息 | 原因與做法 |
|---|---|
| `command not found: npm`、`node`、`rustc`（Mac）；`'npm' 不是內部或外部命令`、`無法辨識 'rustc'`（Windows） | 工具沒裝，或裝完沒有把終端機（PowerShell）關掉重開 |
| `Could not read package.json` | 沒有先 `cd` 到專案資料夾 |
| 一堆 `EBADENGINE` 警告，或 `Cannot find native binding` | Node.js 版本太舊，請升級到 22 以上 |
| `Port 1420 is already in use` | 上一次的程式還開著，在它的終端機按 `Ctrl + C` 關掉 |
| Windows 出現 `linker 'link.exe' not found` | Visual Studio Build Tools 沒裝，或沒勾「使用 C++ 的桌面開發」 |

只想在瀏覽器看看（不能存檔對話框、不能更新匯率）：`npm run dev`，開 <http://localhost:1420>。

## 匯率

### 為什麼需要匯率？

你的資產有些不是台幣：美股用**美元**計價，比特幣（BTC）也是用**美元**報價。要和台幣的存款加在一起，程式得先把它們換成台幣，所以需要兩個數字：

- **美元兌台幣**：1 美元可以換幾元台幣，例如 32。
- **BTC 價格**：1 顆比特幣值幾美元，例如 80,000。

### 程式怎麼用它們

- 美股：美元金額 × 美元兌台幣。例：50,000 美元 × 32 ＝ 1,600,000 元。
- BTC：顆數 × BTC 價格 × 美元兌台幣。例：0.2 顆 × 80,000 × 32 ＝ 512,000 元。

匯率差 1 元，50,000 美元就差 50,000 元台幣，所以建議在做決定前更新一次。

### 怎麼更新

兩種方式，擇一：

1. **手動輸入**：到「資產」→「匯率與幣價」，直接填數字。想用銀行實際換匯的價格，就用這個方式。
2. **按鈕更新**：按「用 TradingView 更新」，程式會自動抓最新價格填進去。

資料來源是 TradingView 的 [TWDUSD](https://tw.tradingview.com/symbols/TWDUSD/) 和 [BTCUSD](https://tw.tradingview.com/symbols/BTCUSD/)。TWDUSD 的意思是「1 台幣值幾美元」（約 0.031），程式會自動倒過來變成「1 美元值幾台幣」（約 32）。

### 要知道的事

- **不會自動更新。** 想更新就按按鈕；更新後的數字會跟著存檔。
- **要連網。** 沒網路時按鈕會失敗，請手動輸入。
- **只有桌面程式能用按鈕。** 瀏覽器版會被擋住，請手動輸入。
- **隱私：** 按鈕只會向 TradingView 問「現在的價格」，不會送出你的任何財務資料。
- **這是市場參考價**，不是銀行的買賣價。實際換匯會有價差和手續費，大額時請以實際成交價為準。
- 按了更新卻顯示失敗：多半是網路問題，稍後再試，或直接手動輸入，不影響其他功能。

## 更多

- 計算規則與試算表對照：`docs/formulas.md`
- 為什麼這樣選技術：`docs/decisions.md`
