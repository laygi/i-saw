// 極簡 CDP 客戶端：用 Node 內建的 WebSocket，不用裝任何東西
export async function connect(port=9222){
  const list=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page=list.find(t=>t.type==='page');
  if(!page) throw new Error('找不到分頁');
  const ws=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej});
  let id=0; const waiting=new Map(); const logs=[];
  ws.onmessage=e=>{
    const m=JSON.parse(e.data);
    if(m.id&&waiting.has(m.id)){const{res,rej}=waiting.get(m.id);waiting.delete(m.id);
      m.error?rej(new Error(JSON.stringify(m.error))):res(m.result)}
    else if(m.method==='Runtime.consoleAPICalled')logs.push(m.params.args.map(a=>a.value??a.description).join(' '));
    else if(m.method==='Runtime.exceptionThrown')logs.push('EXCEPTION '+(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text));
  };
  const send=(method,params={})=>new Promise((res,rej)=>{const i=++id;waiting.set(i,{res,rej});ws.send(JSON.stringify({id:i,method,params}))});
  await send('Runtime.enable');
  await send('Page.enable');
  const evalJS=async(expr,awaitPromise=true)=>{
    const r=await send('Runtime.evaluate',{expression:expr,awaitPromise,returnByValue:true,userGesture:true});
    if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);
    return r.result.value;
  };
  return {send,evalJS,logs,close:()=>ws.close()};
}
export const sleep=ms=>new Promise(r=>setTimeout(r,ms));
