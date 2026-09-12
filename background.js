// Click directly opens the main panel. No intermediate extension popup.
chrome.action.onClicked.addListener(async tab=>{
  try{
    if(!tab?.id||!/^https?:/.test(tab.url||''))throw Error('请切换到 Flow 项目网页后再点击扩展。');
    await chrome.action.setBadgeText({tabId:tab.id,text:''});
    const result=await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>({host:location.hostname,cards:document.querySelectorAll('flow-grid-tile-container').length})});
    const info=result?.[0]?.result;
    if(!info||(!info.cards&&!/^(flow\.google\.com|(?:[a-z0-9-]+\.)*(?:labs|flow)\.google)$/.test(info.host)))throw Error('当前网页没有检测到 Flow 素材。请进入展示图片或视频的项目页面。');
    await chrome.scripting.executeScript({target:{tabId:tab.id},world:'MAIN',files:['bridge.js']});
    await chrome.scripting.executeScript({target:{tabId:tab.id},files:['content.js']});
    const ack=await chrome.tabs.sendMessage(tab.id,{type:'OPEN'});
    if(!ack?.ok||!ack.visible)throw Error('页面脚本尚未更新。请刷新 Flow 网页，再点击扩展。');
  }catch(e){
    const message='Flow 下载助手：'+e.message;
    try{await chrome.scripting.executeScript({target:{tabId:tab.id},func:m=>alert(m),args:[message]});}
    catch{await chrome.tabs.create({url:chrome.runtime.getURL('error.html')+'?message='+encodeURIComponent(message)});}
  }
});
const safe = s => String(s || '').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/[. ]+$/g, '').slice(0, 120).replace(/[. ]+$/g,'').replace(/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?=\.|$)/i,'_$1') || '素材';
let lock = Promise.resolve();
function serial(fn) { const next=lock.then(fn,fn); lock=next.catch(()=>{}); return next; }
chrome.runtime.onMessage.addListener((m, sender, reply) => {
  if (!sender.tab) return;
  const tabId=sender.tab.id;
  const run=async()=>{
    if (m.type==='BEGIN') return serial(async()=>{
      const {owner}=await chrome.storage.session.get('owner');
      if(owner && owner.tabId!==tabId && Date.now()-owner.time<120000) throw Error('另一页正在下载，请先完成该批次');
      await chrome.storage.session.set({owner:{tabId,time:Date.now()}});return {};
    });
    if(m.type==='EXPECT') {
      const {owner}=await chrome.storage.session.get('owner');
      if(owner?.tabId!==tabId)throw Error('下载批次已结束');
      if(!/^flow下载\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/.test(m.folder))throw Error('文件夹格式错误');
      const u=new URL(m.url);if(u.protocol!=='https:')throw Error('素材地址无效');
      await chrome.storage.session.set({plan:{tabId,token:m.token,url:m.url,folder:m.folder,base:safe(m.base),kind:m.kind,time:Date.now(),id:null}});return {};
    }
    if(m.type==='EXPECT_STATUS'){const {plan}=await chrome.storage.session.get('plan');return {id:plan?.tabId===tabId&&plan.token===m.token?plan.id:null};}
    if(m.type==='CLEAR_EXPECT'){const {plan}=await chrome.storage.session.get('plan');if(plan?.tabId===tabId&&plan.token===m.token)await chrome.storage.session.remove('plan');return {};}
    if(m.type==='END') {const {owner}=await chrome.storage.session.get('owner'); if(owner?.tabId===tabId) await chrome.storage.session.remove('owner'); return {};}
    if(m.type==='ARM_NATIVE') {
      const {owner}=await chrome.storage.session.get('owner');
      if(owner?.tabId!==tabId || !m.url?.startsWith('blob:'+new URL(sender.url).origin+'/'))throw Error('原生下载来源不匹配');
      if(!/^flow下载\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/.test(m.folder))throw Error('文件夹格式错误');
      await chrome.storage.session.set({native:{tabId,url:m.url,folder:m.folder,base:safe(m.base),time:Date.now(),id:null}});return {};
    }
    if(m.type==='NATIVE_STATUS'){const {native}=await chrome.storage.session.get('native');return {id:native?.tabId===tabId?native.id:null};}
    if(m.type==='DOWNLOAD') {
      const {owner}=await chrome.storage.session.get('owner');
      if(owner?.tabId!==tabId) throw Error('下载批次已结束');
      const url=new URL(m.url);
      if(!['https:','blob:'].includes(url.protocol)) throw Error('不支持的资源地址');
      if(url.protocol==='blob:' && url.origin!==new URL(sender.url).origin) throw Error('Blob 不属于当前页面');
      if(!/^flow下载\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/.test(m.folder)) throw Error('文件夹格式错误');
      const extension=String(m.originalName||'').match(/\.(png|jpe?g|webp|avif|mp4|webm|mov)$/i)?.[1]?.toLowerCase() || (m.kind!=='image'?'mp4':'png');
      const filename=m.folder+'/'+safe(m.base)+'.'+extension;
      await chrome.storage.session.set({plan:{tabId,token:m.token,url:m.url,folder:m.folder,base:safe(m.base),kind:m.kind,time:Date.now(),id:null}});
      const id=await chrome.downloads.download({url:m.url,filename,saveAs:false,conflictAction:'uniquify'});
      await chrome.storage.session.set({['dl'+id]:{tabId,folder:m.folder},owner:{tabId,time:Date.now()}});
      return {id};
    }
    if(m.type==='STATUS') {
      const record=(await chrome.storage.session.get('dl'+m.id))['dl'+m.id];
      if(record?.tabId!==tabId) throw Error('下载任务不属于当前页');
      const [d]=await chrome.downloads.search({id:m.id});
      await chrome.storage.session.set({owner:{tabId,time:Date.now()}});
      return {state:d?.state||'missing',error:d?.error,bytes:d?.bytesReceived,total:d?.totalBytes,filename:d?.filename,folder:record.folder,savedCorrect:!!record.folder&&String(d?.filename||'').replace(/\\/g,'/').split('/').at(-2)===record.folder};
    }
    if(m.type==='SHOW') {const r=(await chrome.storage.session.get('dl'+m.id))['dl'+m.id];if(r?.tabId===tabId) chrome.downloads.show(m.id);return {};}
    throw Error('未知操作');
  };
  run().then(data=>reply({ok:true,...data}),e=>reply({ok:false,error:e.message}));return true;
});
chrome.downloads.onDeterminingFilename.addListener((item,suggest)=>{
  (async()=>{
    if(item.byExtensionId&&item.byExtensionId!==chrome.runtime.id){suggest();return;}
    const {native}=await chrome.storage.session.get('native');
    const {plan}=await chrome.storage.session.get('plan');
    const exact=(p)=>p&&p.id===null&&item.url===p.url;
    const sameResource=(p)=>{try{const a=new URL(item.url),b=new URL(p.url);return a.protocol==='https:'&&a.origin===b.origin&&a.pathname===b.pathname;}catch{return false;}};
    const nativeMatch=exact(native)&&Date.now()-native.time<20000;
    const planMatch=plan&&plan.id===null&&Date.now()-plan.time<90000&&(exact(plan)||sameResource(plan));
    const intent=nativeMatch?native:planMatch?plan:null;
    if(!intent){suggest();return;}
    const mimeExt={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/avif':'avif','video/mp4':'mp4','video/webm':'webm','video/quicktime':'mov'};
    const ext=mimeExt[item.mime]||item.filename.match(/\.(png|jpe?g|webp|avif|mp4|webm|mov)$/i)?.[1]||(intent.kind!=='image'?'mp4':'png');
    intent.id=item.id;
    await chrome.storage.session.set({[nativeMatch?'native':'plan']:intent,['dl'+item.id]:{tabId:intent.tabId,folder:intent.folder}});
    suggest({filename:intent.folder+'/'+intent.base+'.'+ext,conflictAction:'uniquify'});
  })().catch(()=>suggest());return true;
});
