#!/usr/bin/env python3
"""暫用的星星遮罩產生器。
正式素材由 Lily 提供；這支只是讓「星星對切」濾鏡在拿到正式圖之前就能做、能測。
輸出：白色星星 + 透明背景。程式只讀它的透明度，顏色不重要。
尺寸用 1080x675（1.6）—— 對應 4:5 畫面切一半之後那一格的比例，星星才不會被壓扁。
"""
from PIL import Image, ImageDraw
import math, random

W, H, POINTS = 1080, 675, 10
random.seed(20260918)          # 固定種子：每次產生的圖一模一樣，方便比對

def star(dr, cx, cy, r_out, r_in, rot):
    pts = []
    for i in range(POINTS * 2):
        r = r_out if i % 2 == 0 else r_in
        a = rot + i * math.pi / POINTS
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    dr.polygon(pts, fill=(255, 255, 255, 255))

SS = 4                          # 超取樣：畫大 4 倍再縮，邊緣才不會鋸齒
im = Image.new('RGBA', (W * SS, H * SS), (255, 255, 255, 0))
dr = ImageDraw.Draw(im)

placed = []
for _ in range(2000):
    if len(placed) >= 16: break
    r = random.uniform(26, 58) * SS
    cx = random.uniform(r, W * SS - r)
    cy = random.uniform(r, H * SS - r)
    if any(math.hypot(cx - px, cy - py) < (r + pr) * 0.92 for px, py, pr in placed):
        continue            # 不要疊在一起
    placed.append((cx, cy, r))
    star(dr, cx, cy, r, r * 0.42, random.uniform(0, math.pi))

im.resize((W, H), Image.LANCZOS).save('source/星星遮罩_暫用.png')
print('畫了 %d 顆星，輸出 source/星星遮罩_暫用.png (%dx%d)' % (len(placed), W, H))
