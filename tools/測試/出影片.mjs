/* 跑一次影片輸出並把成品抓回來。
   用法：node 出影片.mjs <濾鏡id> <停留秒數> <輸出mp4路徑> [素材數]
   例：  node 出影片.mjs riso 1 /tmp/out.mp4 2 */
import {connect,sleep} from './cdp.mjs';
import fs from 'node:fs';
const preset=process.argv[2]||'none', dwell=+(process.argv[3]||1), out=process.argv[4]||'/tmp/out.mp4', n=+(process.argv[5]||2);
const c=await connect();
await c.evalJS(`location.href='http://127.0.0.1:8799/film_gallery.html?cb='+Date.now()`,false);
await sleep(4500);
console.log(await c.evalJS(`(()=>{
  const mk=col=>{const cv=document.createElement('canvas');cv.width=800;cv.height=1000;
    const x=cv.getContext('2d');x.fillStyle=col;x.fillRect(0,0,800,1000);return cv.toDataURL('image/png')};
  state.items=['#ff0000','#00ff00','#0000ff','#ffff00'].slice(0,${n}).map((c2,i)=>({src:mk(c2),kind:'image',natAR:0.8,name:'t'+i}));
  state.index=0; state.dwell=${dwell}; document.querySelector('#dwell').value=${dwell};
  selectPreset('${preset}');
  maskState.id='';const ms=document.querySelector('#maskSel');ms.value='';ms.dispatchEvent(new Event('change'));
  clampIndex(); renderItems(); build();
  window.__mp4=null;
  const _c=URL.createObjectURL.bind(URL);
  URL.createObjectURL=b=>{ if(b&&b.type==='video/mp4'){const fr=new FileReader();fr.onload=()=>{window.__mp4=fr.result.split(',')[1]};fr.readAsDataURL(b)} return _c(b)};
  const _k=HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click=function(){ if(this.download)return; return _k.call(this)};
  return '濾鏡='+state.preset+' 幕數='+sceneCount()})()`));
await sleep(2500);
await c.evalJS(`document.querySelector('#rec').click();'go'`);
for(let i=0;i<300;i++){ await sleep(2000); if(await c.evalJS(`!!window.__mp4`))break; }
console.log('狀態:',await c.evalJS(`document.querySelector('#status').textContent`));
const len=await c.evalJS(`window.__mp4?window.__mp4.length:0`);
if(len){let b64='';for(let i=0;i<len;i+=400000)b64+=await c.evalJS(`window.__mp4.slice(${i},${i+400000})`);
  fs.writeFileSync(out,Buffer.from(b64,'base64'));console.log('存出',out,(fs.statSync(out).size/1048576).toFixed(1)+' MB')}
console.log('主控台:',c.logs.slice(-5).join(' | ')||'(乾淨)');
c.close();
