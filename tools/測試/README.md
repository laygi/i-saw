# 測試工具

這個專案沒辦法「看一眼就知道對不對」—— 濾鏡、網點、對齊、輸出的節奏，
全部都要**真的跑出來、量出來**才算數。這裡放的是量測用的小工具。

不用安裝任何東西：Node（系統內建的 WebSocket）＋ macOS 內建的 Swift／AVFoundation。

## 先把環境起起來

```bash
cd "<專案資料夾>"

# 1) 開一個測試用的伺服器（用 8799，才不會跟 serve.command 的 8765 打架）
python3 -m http.server 8799 --directory "$PWD" &

# 2) 開無頭 Chrome
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --remote-debugging-port=9222 \
  --user-data-dir=/tmp/isaw-chrome --no-first-run --no-default-browser-check \
  --autoplay-policy=no-user-gesture-required \
  "http://127.0.0.1:8799/film_gallery.html" &
```

**用到 WebGL 的濾鏡（貓眼、Riso 疊印）**要多加兩個參數，
不然無頭環境沒有 GPU 會直接失敗：

```
  --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader
```

收工：`pkill -f "remote-debugging-port=9222"; pkill -f "http.server 8799"`

## 工具

| 檔案 | 做什麼 |
|---|---|
| `cdp.mjs` | 極簡的 Chrome 遙控客戶端（`connect()` → `evalJS()`、`send()`）。下面幾支都靠它 |
| `出圖.mjs` | 套指定濾鏡、把照片存成 PNG。`node 出圖.mjs riso r ../../source/濾鏡樣本_狗狗.jpg` |
| `出影片.mjs` | 跑一次影片輸出並把 mp4 抓回來。`node 出影片.mjs riso 1 /tmp/out.mp4 2` |
| `probe.swift` | **逐格量 mp4**：每一格的時間戳與平均顏色。`swiftc -O probe.swift -o probe && ./probe /tmp/out.mp4` |
| `grab.swift` | 從 mp4 抓某一秒那一格存成 PNG。`./grab /tmp/out.mp4 3.0 /tmp/f.png` |

## 常用的驗證手法

- **輸出的節奏**：`probe` 印出來的「間隔分布」必須是 `0.0417×N`（＝1/24 秒）**一格例外都沒有**。
  只要出現第二種間隔就是有問題。
- **顏色對不對**：`probe` 也會印每一格的平均顏色，可以看出換場順序、結尾有沒有演出來。
- **濾鏡準不準**：用 Python + PIL 量參考圖（百分位、暗部／中間調／亮部平均色、
  相鄰像素差 rms＝顆粒與清晰度），再量成品，兩邊對數字。
- **網點／字體這種細節**：用 `grab` 抓一格出來**放大**（`Image.NEAREST`）看。
- **介面**：用 CDP 的 `Input.dispatchMouseEvent` **真的按住滑鼠拖**，不要只呼叫 JS 函式。
- **記得繞過快取**：網址後面加 `?cb='+Date.now()`。
  踩過一次：改完程式量到的還是舊版的數字。
