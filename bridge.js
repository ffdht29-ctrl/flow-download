(() => {
  if(window.__flowDownloadBridge) return; window.__flowDownloadBridge=true;
  const click=HTMLAnchorElement.prototype.click, revoke=URL.revokeObjectURL;
  let armed=null; const held=new Set(), revoked=new Set();
  const post=data=>window.postMessage({channel:'FLOW_DL_BRIDGE',...data},location.origin);
  function capture(a) {
    if(!armed || Date.now()>armed.until || armed.captured) return false;
    const url=a.href;
    if(!url || !/^(https:|blob:)/.test(url)) return false;
    if(!a.hasAttribute('download') && !url.startsWith('blob:') && !/flow-content\.google\/(image|video)\//.test(url)) return false;
    armed.captured=true; armed.anchor=a; if(url.startsWith('blob:')) held.add(url);
    post({type:'CAPTURE',token:armed.token,url,name:a.download||''});return true;
  }
  HTMLAnchorElement.prototype.click=function(){if(!capture(this)) return click.call(this);};
  document.addEventListener('click',e=>{
    if(e.isTrusted) return;
    const a=e.target.closest?.('a');if(a && capture(a)){e.preventDefault();e.stopImmediatePropagation();}
  },true);
  URL.revokeObjectURL=function(url){if(held.has(url)){revoked.add(url);return;} return revoke.call(URL,url);};
  window.addEventListener('message',e=>{
    if(e.source!==window || e.origin!==location.origin || e.data?.channel!=='FLOW_DL_CONTROL') return;
    const m=e.data;
    if(m.type==='ARM'){armed={token:m.token,until:Date.now()+Math.max(30000,Math.min(300000,Number(m.timeoutMs)||90000)),captured:false};post({type:'READY',token:m.token});}
    if(m.type==='DISARM' && armed?.token===m.token) armed=null;
    if(m.type==='NATIVE' && armed?.token===m.token && armed.anchor){const a=armed.anchor;armed=null;click.call(a);}
    if(m.type==='RELEASE' && held.has(m.url)){held.delete(m.url);if(revoked.delete(m.url)) revoke.call(URL,m.url);}
  });
})();
