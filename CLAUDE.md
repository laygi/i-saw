# I SAW — 底片感相片藝廊

主檔 `film_gallery.html`，單檔純前端。結構與決策在 `README.md` 和 `CHANGELOG.md`（19 章，每個決策的為什麼都寫了），改東西前先翻 CHANGELOG 看有沒有踩過。
全域規則在 `~/.claude/CLAUDE.md`。

## 🔒 不外流

`my-media/`、`source/` 是她自己的照片與影片。不上傳、不做 Artifact。

## 跑起來

- 一律用 `serve.command`（8765），不要直接雙擊 HTML：它處理快取、HTTP Range、多執行緒。
- `.claude/launch.json` 的 `photo-static` 也是 8765。

## 三個會騙人的地方

1. **預覽對不代表輸出對。** 畫面與影片輸出是兩套渲染器；輸出走的 canvas 不支援 `mask-image`、`backdrop-filter`、`background-blend-mode`。加效果先確認輸出路徑畫得出來。
2. **輸出幀率鎖約 18fps**（Super 8 原生）。修了三輪才到，別隨手動取幀邏輯。
3. **量測也會出錯。** CHANGELOG 記了至少三次假警報。下結論前先確認量法。

## 素材規則

- 圖檔一律 WebP q94（alpha 無損），原圖留在 `source/`。
- 濾鏡是對照參考片量出來的，不是調出來的；參考片在 `source/方寸之間.mov`。
- 載體遮罩在 `masks/`（12 個 SVG＋`slots.json`），`_preview.html` 可預覽。
- **不要直接跑 `tools/genmask.py`**：它會連 4:5 單格／雙格一起重寫（原檔已搬進 `source/`）。
  要重出某一組，寫只產那一組的腳本，先確認跟現檔 byte 相同再改參數（見 CHANGELOG 109）。

## 收尾

每個段落把決策寫進 `CHANGELOG.md`，交接寫 `交接_YYYYMMDD.md`。
