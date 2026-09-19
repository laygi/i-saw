import json, shutil, os, math, random, zlib
OUT="masks"
RATIOS={"4x5":(1080,1350),"9x16":(1080,1920),"16x9":(1920,1080),"1x1":(1080,1080)}
# 格子在「排列方向的垂直軸」上的縮放，置中。用來修正格子被拉得太長的比例
CELL_SCALE={}        # 垂直於排列方向的縮放（置中）
# 沿排列方向的縮放：格子壓扁，多出來的空間平均留在頭尾（黑色留白）
CELL_SCALE_LONG={}
# 指定窗格長寬比（w/h）：在可用範圍內置中，多餘空間留黑
CELL_ASPECT={
  # 單格：依各比例的視覺需求個別指定
  "1-9x16":4/5, "1-16x9":5/4, "1-1x1":5/3,
  # 多格：一律 5:3
  "3-4x5":5/3,
  "2-9x16":5/3, "3-9x16":5/3,
  "2-16x9":5/3, "3-16x9":5/3,
  "2-1x1":5/3,  "3-1x1":5/3,
}
# 「4:3 橫幅單格」：四種輸出尺寸共用同一個窗格比例（外框會變、窗格比例不變）
WIDE_AR=4/3
CELL_ASPECT.update({f"w-{k}":WIDE_AR for k in RATIOS})

def rr(x,y,w,h,r):
    r=min(r,w/2,h/2)
    f=lambda v:f"{v:.1f}".rstrip('0').rstrip('.')
    return (f"M{f(x+r)} {f(y)}H{f(x+w-r)}A{f(r)} {f(r)} 0 0 1 {f(x+w)} {f(y+r)}"
            f"V{f(y+h-r)}A{f(r)} {f(r)} 0 0 1 {f(x+w-r)} {f(y+h)}"
            f"H{f(x+r)}A{f(r)} {f(r)} 0 0 1 {f(x)} {f(y+h-r)}"
            f"V{f(y+r)}A{f(r)} {f(r)} 0 0 1 {f(x+r)} {f(y)}Z")

# ============ 不規則窗格 ============
# 真實的片門／手工遮罩，邊緣不是機器切出來的直線，而是微微起伏、四角弧度也不一致。
# 做法：把圓角矩形沿周長取樣，每個點往法線方向偏移一個「平滑雜訊」，
# 再用 Catmull-Rom 轉成貝茲曲線 —— 所以是起伏不是鋸齒。
def _rr_walk(x,y,w,h,r,N):
    """沿圓角矩形周長等距取樣，回傳 (點, 外法線)。以弧長參數化，起伏頻率才會均勻"""
    r=min(r,w/2,h/2)
    sw_,sh_=w-2*r, h-2*r
    arc=math.pi*r/2
    segs=[("t",sw_),("tr",arc),("r",sh_),("br",arc),("b",sw_),("bl",arc),("l",sh_),("tl",arc)]
    total=sum(l for _,l in segs)
    out=[]
    for i in range(N):
        d=total*i/N
        for kind,l in segs:
            if d<=l or kind==segs[-1][0]: break
            d-=l
        u=d/l if l else 0
        if   kind=="t":  out.append((x+r+sw_*u, y,           0,-1))
        elif kind=="r":  out.append((x+w,       y+r+sh_*u,   1, 0))
        elif kind=="b":  out.append((x+w-r-sw_*u, y+h,       0, 1))
        elif kind=="l":  out.append((x,         y+h-r-sh_*u,-1, 0))
        else:
            cx,cy,a0={"tr":(x+w-r,y+r,-math.pi/2),"br":(x+w-r,y+h-r,0),
                      "bl":(x+r,y+h-r,math.pi/2), "tl":(x+r,y+r,math.pi)}[kind]
            a=a0+(math.pi/2)*u
            nx,ny=math.cos(a),math.sin(a)
            out.append((cx+nx*r, cy+ny*r, nx, ny))
    return out

def _catmull(pts):
    """封閉的 Catmull-Rom → 三次貝茲，確保曲線平滑接合"""
    f=lambda v:f"{v:.1f}".rstrip('0').rstrip('.')
    n=len(pts); d=[f"M{f(pts[0][0])} {f(pts[0][1])}"]
    for i in range(n):
        p0=pts[(i-1)%n]; p1=pts[i]; p2=pts[(i+1)%n]; p3=pts[(i+2)%n]
        c1=(p1[0]+(p2[0]-p0[0])/6, p1[1]+(p2[1]-p0[1])/6)
        c2=(p2[0]-(p3[0]-p1[0])/6, p2[1]-(p3[1]-p1[1])/6)
        d.append(f"C{f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(p2[0])} {f(p2[1])}")
    d.append("Z")
    return "".join(d)

def wobble(x,y,w,h,r,off=0.0,amp=5.5,seed=7,N=56):
    """圓角矩形的不規則版本。off = 整體外擴（描邊用），amp = 起伏振幅（px）"""
    rd=random.Random(seed)
    # 低頻為主：整體微微起伏。高頻壓低，否則圓角會變得像融化的一樣
    waves=[(rd.uniform(1.5,2.3), rd.uniform(0,6.283), 1.0),
           (rd.uniform(3.2,4.6), rd.uniform(0,6.283), .38),
           (rd.uniform(6.4,8.6), rd.uniform(0,6.283), .12)]
    norm=sum(a for _,_,a in waves)
    pts=[]
    for i,(px,py,nx,ny) in enumerate(_rr_walk(x,y,w,h,r,N)):
        t=i/N
        nz=sum(math.sin(t*6.283185*fq+ph)*a for fq,ph,a in waves)/norm
        dd=off+amp*nz
        pts.append((px+nx*dd, py+ny*dd))
    return _catmull(pts)

def cells(W,H,n,key=None):
    """格子沿長邊排列；邊界與間隙沿用遮罩2 的比例"""
    if n==1:
        ms,ml=(66,35) if H>=W else (66,50)          # 短邊 6.1% / 長邊 2.6%
        mx,my=(ms,ml) if H>=W else (ml,ms)
        aw,ah=W-2*mx,H-2*my
        ar=CELL_ASPECT.get(key)
        if ar:                                       # 依指定比例內縮並置中
            cw,ch=(aw,aw/ar) if aw/ar<=ah else (ah*ar,ah)
            return [((W-cw)/2,(H-ch)/2,cw,ch)],0.056
        return [(mx,my,aw,ah)],0.056
    m_s,m_l,gap=77,45,72
    if H>=W:                                         # 直式：上下堆疊
        mx,my=m_s,m_l
        cw=W-2*mx; ch=(H-2*my-gap*(n-1))/n
        k=CELL_SCALE.get(key,1.0); kl=CELL_SCALE_LONG.get(key,1.0)
        cw2=cw*k; ch2=ch*kl
        ar=CELL_ASPECT.get(key)
        if ar:                                       # 指定比例：取能放得下的那一邊
            if cw2/ch2>ar: cw2=ch2*ar
            else:          ch2=cw2/ar
        ox=(W-cw2)/2                                 # 左右置中
        oy=(H-(n*ch2+gap*(n-1)))/2                   # 上下置中，頭尾留黑
        return [(ox,oy+i*(ch2+gap),cw2,ch2) for i in range(n)],0.175
    else:                                            # 橫式：左右並排
        mx,my=m_l,m_s
        ch=H-2*my; cw=(W-2*mx-gap*(n-1))/n
        k=CELL_SCALE.get(key,1.0); kl=CELL_SCALE_LONG.get(key,1.0)
        ch2=ch*k; cw2=cw*kl
        ar=CELL_ASPECT.get(key)
        if ar:
            if cw2/ch2>ar: cw2=ch2*ar
            else:          ch2=cw2/ar
        oy=(H-ch2)/2
        ox=(W-(n*cw2+gap*(n-1)))/2
        return [(ox+i*(cw2+gap),oy,cw2,ch2) for i in range(n)],0.175

def svg(W,H,n,key=None):
    cs,rf=cells(W,H,n,key)
    if n>1:
        if H>=W: lim=cs[1][1]-(cs[0][1]+cs[0][3])      # 直式：垂直間距
        else:    lim=cs[1][0]-(cs[0][0]+cs[0][2])      # 橫式：水平間距
    else:
        lim=2*min(cs[0][0],cs[0][1])                   # 單格：不超出邊界
    wob=bool(key and key.startswith("w-"))          # 只有「4:3 橫幅單格」用不規則邊
    strokes,holes=[],[]
    for ci,(x,y,w,h) in enumerate(cs):
        short=min(w,h)
        r=max(40,min(130,short*rf))
        sw=max(36,min(120,short*0.125,lim))   # 不得超過間距 → 不重疊、不外漏
        if wob:
            sd=zlib.crc32(key.encode())%9973   # 用 crc32 不用 hash()：hash() 每次執行結果不同，遮罩形狀會跑掉
            strokes.append(f'<path d="{wobble(x,y,w,h,r,off=sw/2,seed=sd)}" '
                           f'stroke="#5E0C03" stroke-width="{sw:.1f}"/>')
            holes.append(wobble(x,y,w,h,r,off=0,seed=sd))
        else:
            strokes.append(f'<rect x="{x-sw/2:.1f}" y="{y-sw/2:.1f}" width="{w+sw:.1f}" height="{h+sw:.1f}" '
                           f'rx="{r+sw/2:.1f}" stroke="#5E0C03" stroke-width="{sw:.1f}"/>')
            holes.append(rr(x,y,w,h,r))
    outer=f"M-80 -80H{W+80}V{H+80}H-80Z"
    fx,fy,fw,fh=-200,-200,W+400,H+400
    return f'''<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip)">
<g filter="url(#blurEdge)">
{chr(10).join(strokes)}
</g>
<g filter="url(#blurMatte)">
<path fill-rule="evenodd" clip-rule="evenodd" d="{outer}{''.join(holes)}" fill="black"/>
</g>
</g>
<defs>
<filter id="blurEdge" x="{fx}" y="{fy}" width="{fw}" height="{fh}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="8.5" result="e1"/>
</filter>
<filter id="blurMatte" x="{fx}" y="{fy}" width="{fw}" height="{fh}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="7" result="e1"/>
</filter>
<clipPath id="clip"><rect width="{W}" height="{H}" fill="white"/></clipPath>
</defs>
</svg>
'''

def slots(W,H,n,key=None):
    """素材擺放範圍：窗格各邊外擴 16px，避免邊緣露出縫隙"""
    if n==1 and key not in CELL_ASPECT: return [[0,0,100,100]]
    cs,_=cells(W,H,n,key); E=16
    return [[round((x-E)/W*100,2),round((y-E)/H*100,2),
             round((w+2*E)/W*100,2),round((h+2*E)/H*100,2)] for (x,y,w,h) in cs]

SLOTS={}
for rk,(W,H) in RATIOS.items():
    for n in (1,2,3):
        name=f"mask-{n}cell-{rk}.svg"
        # 4:5 的單格與雙格沿用你手繪的原檔，不覆蓋
        src={1:"遮罩1.svg",2:"遮罩2.svg"}.get(n) if rk=="4x5" else None
        if src and os.path.exists(src):
            shutil.copyfile(src,os.path.join(OUT,name))
        else:
            open(os.path.join(OUT,name),"w").write(svg(W,H,n,f"{n}-{rk}"))
        SLOTS[f"{n}-{rk}"]=slots(W,H,n,f"{n}-{rk}")
    # 4:3 橫幅單格：跟單格同一套幾何，只是比例鎖死 4:3
    wk=f"w-{rk}"
    open(os.path.join(OUT,f"mask-wcell-{rk}.svg"),"w").write(svg(W,H,1,wk))
    SLOTS[wk]=slots(W,H,1,wk)
# 4:5 雙格沿用原檔 → slot 也用原本 HTML 裡的值
SLOTS["2-4x5"]=[[5.6,2.2,88.8,46.0],[5.6,50.9,88.8,46.0]]
open(os.path.join(OUT,"slots.json"),"w").write(json.dumps(SLOTS,ensure_ascii=False))
print(json.dumps(SLOTS,ensure_ascii=False,indent=1))
