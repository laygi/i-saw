/* 量一張參考圖的「底片特徵」。會自動把手機截圖上下的黑邊切掉。 */
import {connect} from '/Users/lilychen/Library/Mobile Documents/com~apple~CloudDocs/Vibe Code/Photo/tools/測試/cdp.mjs';
import fs from 'node:fs';
const c=await connect();
const f=process.argv[2];
const b=fs.readFileSync(f).toString('base64');
await c.evalJS(`window.__r=''`);
for(let o=0;o<b.length;o+=400000) await c.evalJS(`window.__r+=`+JSON.stringify(b.slice(o,o+400000)));
const r=await c.evalJS(`(async()=>{
  const im=new Image(); im.src='data:image/png;base64,'+window.__r; await im.decode();
  const W=im.naturalWidth,H=im.naturalHeight;
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;
  const x=cv.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0);
  const D=x.getImageData(0,0,W,H).data;
  const at=(px,py)=>{const i=(py*W+px)*4;return [D[i],D[i+1],D[i+2]]};
  /* 自動找內容區：整列平均亮度 > 18 才算有畫面 */
  const rowLum=py=>{let s=0;for(let px=0;px<W;px+=4){const[a,b2,cc]=at(px,py);s+=(a+b2+cc)/3}return s/(W/4)};
  const ok=[]; for(let py=0;py<H;py++) ok.push(rowLum(py)>25);
  let bs=0,bl=0,cs=-1;
  for(let py=0;py<H;py++){
    if(ok[py]){ if(cs<0)cs=py; }
    else { if(cs>=0&&py-cs>bl){bl=py-cs;bs=cs} cs=-1; }
  }
  if(cs>=0&&H-cs>bl){bl=H-cs;bs=cs}
  const y0=bs, y1=bs+bl-1, h=bl;
  /* 取樣 */
  const px=[],lum=[];
  for(let py=y0;py<=y1;py+=2)for(let pxx=0;pxx<W;pxx+=2){
    const p=at(pxx,py);px.push(p);lum.push(.2126*p[0]+.7152*p[1]+.0722*p[2]);
  }
  const srt=[...lum].sort((a,b)=>a-b);
  const pct=q=>Math.round(srt[Math.floor(q*(srt.length-1))]);
  const band=(lo,hi)=>{let r=0,g=0,b2=0,n=0;
    for(let i=0;i<px.length;i++){if(lum[i]>=lo&&lum[i]<hi){r+=px[i][0];g+=px[i][1];b2+=px[i][2];n++}}
    return n?[Math.round(r/n),Math.round(g/n),Math.round(b2/n),+(n/px.length*100).toFixed(1)]:[0,0,0,0]};
  /* 飽和度 */
  let sat=0; for(const p of px){const mx=Math.max(...p),mn=Math.min(...p);sat+=mx?(mx-mn)/mx:0}
  sat/=px.length;
  /* 顆粒：相鄰像素亮度差 rms（在中間調區域量，避免被邊緣影響） */
  let se=0,n2=0;
  for(let py=y0+2;py<y1-2;py+=3)for(let pxx=2;pxx<W-2;pxx++){
    const a=at(pxx,py),b2=at(pxx-1,py);
    const la=(a[0]+a[1]+a[2])/3, lb=(b2[0]+b2[1]+b2[2])/3;
    if(la>40&&la<210){se+=(la-lb)*(la-lb);n2++}
  }
  /* 爆掉的亮部 */
  let blown=0,crushed=0,hard=0,near=0;
  for(let i=0;i<lum.length;i++){
    const l=lum[i], p=px[i];
    if(l>250)blown++;
    if(l<12)crushed++;
    if(Math.min(p[0],p[1],p[2])>=250)hard++;   /* 真的爆掉：三個通道都到頂 */
    if(l>=235)near++;                          /* 接近爆掉 */
  }
  /* 左右／上下的色偏（找漏光） */
  const region=(ax,bx,ay,by)=>{let r=0,g=0,b2=0,n=0;
    for(let py=Math.round(y0+h*ay);py<Math.round(y0+h*by);py+=3)
      for(let pxx=Math.round(W*ax);pxx<Math.round(W*bx);pxx+=3){
        const p=at(pxx,py);r+=p[0];g+=p[1];b2+=p[2];n++}
    return [Math.round(r/n),Math.round(g/n),Math.round(b2/n)]};
  return {W,H,內容區:[y0,y1],內容尺寸:W+'x'+h,
    百分位:{p1:pct(.01),p10:pct(.10),p50:pct(.50),p90:pct(.90),p99:pct(.99)},
    爆掉比例:+(blown/lum.length*100).toFixed(2), 真爆:+(hard/lum.length*100).toFixed(2), 近爆:+(near/lum.length*100).toFixed(2), 死黑比例:+(crushed/lum.length*100).toFixed(2),
    暗部:band(0,64), 中間調:band(64,160), 亮部:band(160,256),
    飽和:+sat.toFixed(3),
    顆粒rms:+Math.sqrt(se/n2).toFixed(2),
    左緣:region(0,.12,.1,.9), 右緣:region(.88,1,.1,.9),
    上緣:region(.1,.9,0,.12), 下緣:region(.1,.9,.88,1)};
})()`);
console.log(JSON.stringify(r,null,1));
c.close();
