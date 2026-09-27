/* 用無頭 Chrome 跑這個工具，套指定濾鏡、存出 PNG。
   用法：node 出圖.mjs <濾鏡id> <輸出前綴> <圖檔1> [圖檔2 …]
   例：  node 出圖.mjs riso r ../../source/濾鏡樣本_狗狗.jpg
   （要先照 tools/測試/README.md 把伺服器跟 Chrome 起起來） */
import {connect,sleep} from './cdp.mjs';
import fs from 'node:fs';
const preset=process.argv[2], tag=process.argv[3], files=process.argv.slice(4);
if(!preset||!tag||!files.length){console.log('用法: node 出圖.mjs <濾鏡id> <前綴> <圖檔…>');process.exit(1)}
const c=await connect();
await c.evalJS(`location.href='http://127.0.0.1:8799/film_gallery.html?cb='+Date.now()`,false);
await sleep(4500);
const items=files.map((f,i)=>({src:'data:image/'+(f.toLowerCase().endsWith('.png')?'png':'jpeg')+';base64,'+fs.readFileSync(f).toString('base64'),name:'t'+i}));
console.log(await c.evalJS(`(async()=>{
  const items=${JSON.stringify(items)};
  state.items=[];
  for(const it of items){
    const im=new Image(); im.src=it.src; await new Promise(r=>{im.onload=r;im.onerror=r});
    state.items.push({src:it.src,kind:'image',natAR:im.naturalWidth/im.naturalHeight||0.8,name:it.name});
  }
  state.index=0; selectPreset('${preset}');
  maskState.id='';const ms=document.querySelector('#maskSel');ms.value='';ms.dispatchEvent(new Event('change'));
  document.querySelector('#aspect').value='auto'; applyAspect();
  clampIndex(); renderItems(); build();
  window.__png=[];
  const _c=URL.createObjectURL.bind(URL);
  URL.createObjectURL=b=>{ if(b&&b.type==='image/png'){const fr=new FileReader();fr.onload=()=>window.__png.push(fr.result.split(',')[1]);fr.readAsDataURL(b)} return _c(b)};
  const _k=HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click=function(){ if(this.download)return; return _k.call(this)};
  return '濾鏡='+state.preset+' 素材='+state.items.length+' 幕數='+sceneCount()})()`));
await sleep(2000);
await c.evalJS(`document.querySelector('#recImg').click();'go'`);
for(let i=0;i<60;i++){await sleep(1000); const s=await c.evalJS(`document.querySelector('#status').textContent`); if(/^完成|失敗/.test(s)){console.log('狀態:',s);break}}
await sleep(1500);
const n=await c.evalJS(`window.__png.length`);
for(let i=0;i<n;i++){
  const len=await c.evalJS(`window.__png[${i}].length`);
  let b64=''; for(let o=0;o<len;o+=400000) b64+=await c.evalJS(`window.__png[${i}].slice(${o},${o+400000})`);
  fs.writeFileSync(`/tmp/${tag}-${i+1}.png`,Buffer.from(b64,'base64')); console.log('存出 /tmp/'+tag+'-'+(i+1)+'.png');
}
console.log('主控台:',c.logs.slice(-5).join(' | ')||'(乾淨)');
c.close();
