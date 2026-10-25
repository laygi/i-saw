# I SAW 共用設計系統

正式來源：`assets/design-tokens.css` 與 `assets/design-components.css`。
編輯器與 Gallery 使用相對連結；公開元件庫位於 `design-system/`，以相對路徑引用相同樣式；原私人 Sites 展示引用 GitHub Pages 的相同檔案。

- Tokens：品牌色、紙色、字族、分隔線、紙材。
- Components：現有按鈕、設定列、輸入欄、滑桿與共用頁首。
- 保留頁面自己的版面、媒體處理、彈窗及響應式覆寫。
- 修改共用樣式請更新此處，避免將共用宣告複製回各頁 inline CSS。
- 破壞性變更先在元件庫與兩個正式頁預覽，再同步調整版本查詢參數。
- 元件庫的 30px 小按鈕、錯誤輸入示範及使用規範仍屬補充建議。

正式樣式網址：
https://laygi.github.io/i-saw/assets/design-tokens.css
https://laygi.github.io/i-saw/assets/design-components.css

## v1.1 覆蓋檢查（2026-10-25）

新增 `assets/design-patterns.css` 與 `assets/design-gallery.css`，兩者也由私人元件庫直接引用正式網址。

| 家族 | 共用 CSS | 元件庫狀態 |
| --- | --- | --- |
| 色彩、字體、紙材、線條 | design-tokens | 已收錄；色票與 JSON 匯出讀取 computed tokens |
| 按鈕、輸入、滑桿、頁首 | design-components | 已收錄；頁首為頁面構圖 |
| 開關、色票、取色器、自製選單 | design-patterns | 已補齊；有鍵盤選單、色碼驗證 |
| 摺疊面板、重設、濾鏡卡片 | design-patterns | 改為正式 class，移除舊的展示模擬樣式 |
| 素材縮圖、新增、快捷秒數 | design-patterns | 已補齊；展示照片只在瀏覽器處理 |
| 輸出範圍、進度、取消 | design-patterns | 已補齊；示範錯誤、取消與完成 |
| 亞麻彈窗表面、縫線、鈕扣關閉 | design-patterns | 已補齊；位置與原生 dialog 行為由各頁管理 |
| Gallery 卡片、標籤、詳細視窗 | design-gallery | 已補齊，含手機與平板樣式 |

Gallery 共用選擇器以 `:where(.isaw-gallery)` 限定範圍，避免干擾編輯器與元件庫文件本身的標籤。原始選擇器權重維持不變。

有意保留於正式頁：影像濾鏡引擎、影片裁切／轉檔、字幕時間軸、Our Story 描圖紙動畫、銀盒、蕾絲定位與各頁響應式構圖。這些是產品流程與場景，元件庫的覆蓋清單已列出，並提供正式編輯器入口。

本次驗證：兩頁 JavaScript 與前版逐字相同；node 語法檢查；CSS 素材路徑；共用基礎宣告不再重複留於 inline；Gallery 詳情與套用、編輯器原有選單／縮圖；元件庫開關、色票、色碼、鍵盤選單、範圍錯誤、進度狀態。未重新執行 MP4 匯出。

## 公開展示網頁

公開網址：https://laygi.github.io/i-saw/design-system/

展示頁原始碼位於 `design-system/`，與正式網站使用相同 `assets/`。後續更新公開展示請修改此目錄；原 Sites 網址仍是獨立部署，若需同步需另行發布。

## v1.2 — OKLCH UI 色階

四個色系均含 50、100、200、300、400、500、600、700、800、900、950：
- `--red-*`：品牌主色。
- `--beige-*`：輔助米色、紙材表面與暖色文字。
- `--blue-*`：備用資訊輔助色。
- `--neutral-*`：無彩色，C = 0。

來源為 `tools/build-color-tokens.py` 內的 OKLCH 數值。執行 `python3 tools/build-color-tokens.py` 產生 `assets/design-tokens.css` 與 `assets/design-colors.json`；`--check` 可檢查輸出一致性、各色系 L 遞減、sRGB 色域、品牌錨點與文字配對的對比。改色時改生成器再重新產生，勿分別修改生成檔。

既有品牌錨點保留：red-600 = #AC242E、red-900 = #5C131A、beige-100 = #EBE7DD、beige-200 = #E2DDD1、beige-600 = #6F6A60、beige-900 = #1A1917、beige-950 = #141412。米色深階帶微量暖色彩度；純無彩請使用 neutral。

新增 UI 優先使用 `--ui-*` 語意變數。舊別名保留原外觀；新次要文字使用 ui-text-muted（beige-700），搭配 ui-bg（beige-100）為 6.60:1。舊 muted（beige-600）與紙底約 4.35:1，不推薦為新增的一般小字配色。品牌操作為 red-600、懸停 red-700、按下 red-800，文字 neutral-50。藍色以 ui-info、ui-info-bg、ui-info-border 提供備用搭配。

公開色彩頁支援 44 色選取、OKLCH／HEX／Token 複製、語意用途表、配色預覽、文字對比與 CSS／JSON 下載。值皆來自同一份生成資料；HEX 是 sRGB 對照，不是第二套來源。目前只定義淺色 UI，未新增深色主題。
