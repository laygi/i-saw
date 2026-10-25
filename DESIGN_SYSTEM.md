# I SAW 共用設計系統

正式來源：`assets/design-tokens.css` 與 `assets/design-components.css`。
編輯器與 Gallery 使用相對連結；私人元件庫引用 GitHub Pages 上相同的兩份檔案。

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
