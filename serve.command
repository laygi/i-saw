#!/bin/bash
# Film Gallery 本機伺服器 — 雙擊即可啟動
# 停止：在這個視窗按 Control-C，或直接關掉視窗

DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=8765
URL="http://localhost:$PORT/film_gallery.html"

# 若 port 已被舊的伺服器佔用，先關掉
OLD=$(lsof -tnP -iTCP:$PORT -sTCP:LISTEN 2>/dev/null)
if [ -n "$OLD" ]; then
  echo "關閉舊的伺服器 (PID $OLD)…"
  kill -9 $OLD 2>/dev/null
  sleep 1
fi

echo "資料夾：$DIR"
echo "網址：  $URL"
echo "停止：  按 Control-C"
echo

# 稍後開瀏覽器，讓伺服器先站起來
( sleep 1; open "$URL" ) &

# 指定絕對路徑啟動（iCloud 資料夾直接用 -m http.server 會踩到權限問題）
exec python3 -c "
import sys, os, re, functools, http.server, socketserver
class _Slice:
    def __init__(self, f, n): self.f=f; self.n=n
    def read(self, k=-1):
        if self.n<=0: return b''
        if k is None or k<0 or k>self.n: k=self.n
        d=self.f.read(k); self.n-=len(d); return d
    def close(self): self.f.close()
D, P = sys.argv[1], int(sys.argv[2])
os.chdir(D)
class H(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        # 支援 HTTP Range：影片才能拖曳進度／跳轉
        rng = self.headers.get('Range')
        if not rng:
            return super().send_head()
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()
        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404); return None
        size = os.fstat(f.fileno()).st_size
        m = re.match(r'bytes=(\d*)-(\d*)', rng.strip())
        if not m:
            f.close(); self.send_error(400); return None
        a, b = m.group(1), m.group(2)
        if a == '':
            start = max(0, size - int(b)); end = size - 1
        else:
            start = int(a); end = int(b) if b else size - 1
        if start >= size:
            f.close()
            self.send_response(416)
            self.send_header('Content-Range', 'bytes */%d' % size)
            self.end_headers(); return None
        end = min(end, size - 1)
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Range', 'bytes %d-%d/%d' % (start, end, size))
        self.send_header('Content-Length', str(end - start + 1))
        self.end_headers()
        f.seek(start)
        self._range_left = end - start + 1
        return _Slice(f, self._range_left)

    def end_headers(self):
        self.send_header('Accept-Ranges', 'bytes')
        # 停用快取：否則改了檔案，瀏覽器可能還是給你舊版
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
Handler = functools.partial(H, directory=D)
class Srv(socketserver.ThreadingTCPServer):   # 多執行緒：大檔傳輸不會卡住其他請求
    daemon_threads = True
    allow_reuse_address = True
with Srv(('127.0.0.1', P), Handler) as s:
    s.serve_forever()
" "$DIR" "$PORT"
