# I SAW Design System

公開元件庫：https://laygi.github.io/i-saw/design-system/

這個資料夾存放展示頁的 HTML、CSS 與 JavaScript，與正式網站一起版本管理。
共用樣式與圖片直接使用上層 `assets/`，不另複製素材與 Tokens。

- `index.html`：元件展示、設計基礎、使用規範與覆蓋清單。
- `style.css`：文件版面與展示區的特定排列。
- `app.js`：元件展示的操作、搜尋、色票與 Tokens 匯出。
- `../assets/design-tokens.css`：品牌設計變數。
- `../assets/design-components.css`：基礎元件。
- `../assets/design-patterns.css`：互動元件樣式。
- `../assets/design-gallery.css`：Gallery 卡片與詳細視窗。

本機預覽請從 repository 根目錄啟動靜態伺服器，例如 `python3 -m http.server 8782`，再開啟 `/design-system/`。
影片裁切、轉檔、濾鏡引擎與字幕時間軸仍由正式編輯器處理。展示範例不產生影片。
