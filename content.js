(() => {
  if(window.__flowDownloadUI) return;window.__flowDownloadUI=true;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const msg=async m=>{const r=await chrome.runtime.sendMessage(m);if(!r?.ok) throw Error(r?.error||'扩展连接失效，请刷新页面');return r;};
  const control=m=>window.postMessage({channel:'FLOW_DL_CONTROL',...m},location.origin);
  const text=e=>(e?.textContent||'').trim();
  const visible=e=>!!e?.getClientRects().length && getComputedStyle(e).visibility!=='hidden';
  const disabled=e=>!e || e.disabled || e.getAttribute('aria-disabled')==='true' || e.classList.contains('mat-mdc-menu-item-disabled');
  const host=document.createElement('div');host.id='flow-download-helper';
  host.style.cssText='position:fixed;inset:0;z-index:2147483000;pointer-events:none;display:none';
  document.documentElement.append(host);const root=host.attachShadow({mode:'open'});
  root.innerHTML=`<style>
  :host{font:14px/1.5 system-ui,sans-serif;color:#18293b}*{box-sizing:border-box}button,input{font:inherit}button{cursor:pointer;border:1px solid #cbd8e3;border-radius:9px;padding:8px 13px;background:white;color:#203b51}button:disabled{opacity:.45;cursor:default}button.primary{background:#137c70;color:white;border-color:#137c70}input{accent-color:#137c70}input[type=checkbox]{width:18px;height:18px;cursor:pointer}dialog{position:absolute;inset:24px 24px 24px auto;margin:0;width:min(750px,calc(100vw - 48px));height:calc(100vh - 48px);padding:0;border:1px solid #d6e3e9;border-radius:18px;box-shadow:0 15px 70px #152c4940;background:#f7fafc;pointer-events:auto;display:flex;flex-direction:column;color:inherit}header{padding:20px 24px;background:white;border-radius:18px 18px 0 0;display:flex;justify-content:space-between;align-items:center}h2{font-size:21px;margin:0}.sub{color:#647687;font-size:12px}.tools{padding:12px 24px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}.stats{padding:0 24px 10px;font-weight:600}#notice{margin:0 24px 12px;color:#466275;white-space:pre-wrap;overflow-wrap:anywhere}#list{padding:0 24px 16px;overflow:auto;flex:1;min-height:100px;display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:12px;align-content:start}.card{cursor:pointer;background:white;border:1px solid #dce5ec;border-radius:12px;overflow:hidden;position:relative}.card.selected{border-color:#137c70;box-shadow:0 0 0 2px #137c7030}.card:focus-visible{outline:3px solid #278ad0}.badge{position:absolute;right:7px;top:7px;padding:3px 9px;border-radius:6px;font-size:12px;font-weight:700;z-index:2;pointer-events:none}.badge.image{background:#e3f3ee;color:#12664f}.badge.video{background:#eee7fc;color:#603b9a}.preview{height:148px;width:100%;object-fit:contain;background:#edf2f6;display:block}.card input{position:absolute;top:8px;left:8px;z-index:1}.body{padding:9px}.title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}.status{font-size:12px;color:#517064;overflow-wrap:anywhere}.foot{padding:14px 24px;background:white;border-top:1px solid #dce5ec;border-radius:0 0 18px 18px}.row{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.options{margin-bottom:12px;display:flex;gap:8px;align-items:center}#selection{margin-left:auto}.empty{grid-column:1/-1;padding:40px 10px;text-align:center;color:#647687}.small{font-size:12px;margin-top:8px;color:#63778a}

  dialog{inset:14px 14px auto auto;width:min(540px,calc(100vw - 28px));height:min(700px,calc(100vh - 28px));max-height:calc(100vh - 28px);border-radius:14px;overflow:hidden}header{padding:10px 14px;flex:none}h2{font-size:17px}.sub{font-size:11px}button{padding:5px 9px;font-size:12px}.tools{padding:8px 14px;gap:8px;flex:none}.stats{padding:0 14px 6px;font-size:12px;flex:none}#notice{margin:0 14px 6px;font-size:11px;max-height:34px;overflow:auto;flex:none}.select-tools{padding:0 14px 7px;display:flex;gap:6px;align-items:center;flex-wrap:wrap;flex:none}.help{font-size:10px;color:#63778a;padding:0 14px 6px;flex:none}#list{padding:8px 14px 14px;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;scrollbar-gutter:stable;flex:1 1 0;min-height:0;grid-template-columns:repeat(auto-fill,minmax(135px,1fr));grid-auto-rows:242px;align-content:start;align-items:start;gap:10px;user-select:none;touch-action:pan-y;outline:none}.card input{top:3px}.card .badge{top:3px}.card{height:242px;min-height:242px;max-height:242px;flex-shrink:0;padding-top:22px}.preview{height:154px;min-height:154px;max-height:154px;object-fit:contain;object-position:center;width:100%;-webkit-user-drag:none}.body{height:64px;overflow:auto;padding:6px 8px;font-size:11px}.body strong{font-size:11px}.status,.title{font-size:10px}.badge{font-size:10px;padding:2px 6px}.foot{padding:9px 14px;flex:none}.options{font-size:11px;margin-bottom:7px;gap:5px}.small{font-size:10px;margin-top:5px}.row{gap:7px}.empty{height:120px}.selection-box{position:fixed;border:1px solid #138678;background:#13867826;pointer-events:none;z-index:10}.selection-box[hidden]{display:none}@media(max-height:540px){.sub,.small,.help{display:none}header{padding:7px 14px}.tools{padding:5px 14px}.options{margin-bottom:4px}#notice{max-height:18px}dialog{height:calc(100vh - 16px);top:8px}}
.filter-tools{display:flex;gap:6px;padding:0 14px 7px;align-items:center;flex:none;font-size:11px}.filter-tools button[aria-pressed="true"]{background:#137c70;color:white}.card[hidden]{display:none}.badge.scene{background:#fff0d9;color:#935d12}  </style><dialog open aria-label="Flow 素材下载助手"><header><div><h2>Flow 下载助手 <span class="sub">1.0.5</span></h2><div class="sub">图片与视频 · 预览、勾选、批量保存</div></div><button id="close" title="收起面板，任务继续">收起</button></header><div class="tools"><button id="scan" class="primary">扫描完整列表</button><button id="current">刷新已加载</button><label class="row"><input id="all" type="checkbox">全选</label><span id="selection">已选 0 项</span></div><div class="stats" id="stats">视频 0 · 图片 0</div><div id="notice">打开 Flow 项目后点击扫描。完整扫描会滚动当前素材列表，不展开组内历史版本。</div><div class="filter-tools" aria-label="显示类型"><span>显示：</span><button id="filter-all" aria-pressed="true">全部</button><button id="filter-image" aria-pressed="false">图片</button><button id="filter-video" aria-pressed="false">普通视频</button><button id="filter-scene" aria-pressed="false">场景视频</button></div><div class="select-tools"><button id="none">取消全选</button><button id="invert">反选</button><button id="image">只选图片</button><button id="video">只选视频</button></div><div class="help">Ctrl+A 全选 · Shift 连选 · 拖动框选 · Ctrl 拖动反选区域 · Shift 拖动追加</div><div id="list" tabindex="0" aria-label="素材列表，可滚动和多选"><div class="empty">扫描后在这里预览素材</div></div><div class="foot"><label class="options"><input type="checkbox" id="prefer">图片优先 2K，不可用或明确失败时回退 1K</label><div class="row"><button class="primary" id="download">下载当前显示的已选项</button><button id="stop" disabled>停止后续任务</button><button id="show" disabled>打开下载位置</button></div><div class="small">视频：原始大小 · 图片：默认 1K · 下载期间请保持此页打开，勿手动操作菜单或下载。</div></div></dialog><div id="rubberband" class="selection-box" hidden></div>`;
  const $=id=>root.getElementById(id);let items=new Map(),busy=false,scanning=false,stop=false,project='',lastDownload=null,currentCapture=null;
  let displayFilter='all';
  const visibleItems=()=>[...items.values()].filter(a=>displayFilter==='all'||a.kind===displayFilter);
  const notice=s=>$('notice').textContent=s;
  function viewport(){
    const tile=document.querySelector('flow-grid-tile-container');
    const vp=tile?.closest('cdk-virtual-scroll-viewport')||document.querySelector('cdk-virtual-scroll-viewport');
    for(let e=vp||tile?.parentElement;e;e=e.parentElement){
      if(e.clientHeight>0 && e.scrollHeight>e.clientHeight+3 && /(auto|scroll)/.test(getComputedStyle(e).overflowY))return e;
    }
    return vp||document.scrollingElement;
  }
  function promptText(tile){
    const candidates=[tile.getAttribute('data-prompt'),tile.querySelector('[data-prompt]')?.getAttribute('data-prompt'),tile.querySelector('[data-prompt-text]')?.getAttribute('data-prompt-text'),tile.getAttribute('title'),tile.querySelector('.footer-title')?.getAttribute('title')].filter(Boolean);
    const explicit=candidates.find(t=>!/[.…]$/.test(t.trim()));
    return explicit||tile.getAttribute('aria-label')||text(tile.querySelector('.footer-title'))||'未命名素材';
  }
  function mediaURL(value){return /^(https:|blob:)/.test(value||'')?value:'';}
  function tileSlot(tile){
    const vp=viewport(),r=tile.getBoundingClientRect(),v=vp?.getBoundingClientRect?.()||{top:0,left:0};
    return Math.round(r.top-v.top+(vp?.scrollTop||0))+':'+Math.round(r.left-v.left);
  }
  function sceneAsset(tile,scene){
    if(scene.querySelector('flow-pending-tile,flow-error-tile,flow-failed-tile'))return null;
    const title=promptText(tile),slot=tileSlot(tile);
    const clipURLs=[...scene.querySelectorAll('video[src]')].map(v=>v.getAttribute('src')).filter(Boolean);
    const id=scene.getAttribute('data-scene-id')||tile.getAttribute('data-scene-id')||'';
    const signature=clipURLs.map(u=>{try{return new URL(u).pathname;}catch{return '';}}).join('|');
    const cover=scene.querySelector('img'),film=scene.querySelector('[style*="--clip-thumbnail-url"]');
    const preview=mediaURL(cover?.currentSrc||cover?.getAttribute('src')||film?.getAttribute('style')?.match(/--clip-thumbnail-url:\s*url\(["']?(.*?)["']?\)/)?.[1]);
    return {key:'scene:'+(id||slot+':'+title),id,slot,kind:'scene',url:'',preview,title,clipSignature:signature,top:viewport()?.scrollTop||0};
  }
  function asset(tile){
    if(tile.querySelector('flow-pending-tile,flow-error-tile,flow-failed-tile,[class*="error-container"]'))return null;
    const scene=tile.querySelector('flow-scene-tile');if(scene)return sceneAsset(tile,scene);
    const container=tile.querySelector('flow-video-tile'),video=container?.querySelector('video'),img=tile.querySelector('flow-image-tile img[data-media-id]');
    const phase=(container?.getAttribute('data-status')||tile.getAttribute('data-status')||'').toLowerCase();
    if(/pending|running|generating|queued|failed|error|processing/.test(phase))return null;
    if(!container&&!img)return null;
    const kind=container?'video':'image';
    const url=mediaURL((video||img)?.currentSrc||(video||img)?.getAttribute('src')||video?.querySelector('source')?.getAttribute('src'));
    if(kind==='image'&&!url)return null;
    // A ready video UI is sufficient; do not wait for its lazy-loaded playback URL.
    const ready=video||/^(complete|completed|succeeded|success|ready)$/.test(phase)||container?.querySelector('flow-video-hotbar,button[aria-label="更多選項"],button[aria-label="更多选项"],button[aria-label="More options"]');
    if(kind==='video'&&!ready)return null;
    let id=(video||img)?.getAttribute('data-media-id')||container?.getAttribute('data-media-id')||tile.getAttribute('data-media-id')||container?.getAttribute('data-video-id')||'';
    if(!id&&url.startsWith('https:')){try{const u=new URL(url);if(u.pathname.includes('/'+kind+'/'))id=u.pathname.split('/').filter(Boolean).pop();}catch{}}
    const title=promptText(tile),slot=tileSlot(tile);
    let preview=kind==='image'?url:mediaURL(video?.poster||video?.getAttribute('poster')||container?.querySelector('img')?.currentSrc||container?.querySelector('img')?.getAttribute('src')||container?.getAttribute('data-poster'));
    if(!preview&&container){const el=container.querySelector('[style*="background-image"]');const bg=el?.style.backgroundImage||'';preview=mediaURL(bg.match(/url\(["']?(.*?)["']?\)/)?.[1]);}
    return {key:kind+':'+(id||'slot:'+slot+':'+title),id,slot,kind,url,preview,title,resolution:kind==='video'?(text(tile).match(/\b\d{3,4}p\b/)||[])[0]:'',top:viewport()?.scrollTop||0};
  }
  function collect(){
    for(const tile of document.querySelectorAll('flow-grid-tile-container')){
      const a=asset(tile);if(!a)continue;
      const old=items.get(a.key)||[...items.values()].find(i=>i.kind===a.kind&&((i.id&&a.id&&i.id===a.id)||((!i.id||!a.id)&&i.slot===a.slot&&i.title===a.title)));
      if(old){const key=old.key;Object.assign(old,a,{key,id:a.id||old.id,url:a.url||old.url,preview:a.preview||old.preview});}
      else items.set(a.key,{...a,selected:true,status:a.url?'可下载':'可下载 · 下载时获取地址'});
    }
  }
  function refreshPreview(a){
    const tag=a.preview?'img':a.kind==='video'&&a.url?'video':'div',source=a.preview||a.url||'',signature=tag+':'+source;
    if(a.previewSignature===signature)return;
    const preview=document.createElement(tag);preview.className='preview';preview.draggable=false;preview.style.pointerEvents='none';
    if(tag==='img'){preview.src=source;preview.loading='lazy';preview.alt=a.title;}
    else if(tag==='video'){preview.src=source;preview.preload='metadata';preview.muted=true;preview.playsInline=true;preview.onloadedmetadata=()=>{try{preview.currentTime=Math.min(.1,preview.duration/2);}catch{}};}
    else {preview.textContent=a.kind==='scene'?'🎬 场景视频 · 完整导出':'▶ 视频已识别 · 封面待加载';preview.style.cssText='display:flex;align-items:center;justify-content:center;text-align:center;padding:16px;font-size:12px;color:#603b9a;pointer-events:none';}
    if(a.previewNode)a.previewNode.replaceWith(preview);else a.card.append(preview);
    a.previewNode=preview;a.previewSignature=signature;
  }
  function selection(){const a=visibleItems(),n=a.filter(i=>i.selected).length;$('selection').textContent=`当前显示 ${a.length} 项 · 已选 ${n} 项`;$('all').checked=!!a.length&&n===a.length;$('all').indeterminate=n>0&&n<a.length;}
  function render(){
    const list=$('list');list.querySelector('.empty')?.remove();
    for(const a of items.values()){
      if(a.card){a.card.hidden=displayFilter!=='all'&&a.kind!==displayFilter;refreshPreview(a);a.checkbox.checked=a.selected;a.checkbox.disabled=busy&&!scanning;a.card.classList.toggle('selected',a.selected);continue;}
      const card=document.createElement('div');card.className='card';a.card=card;card.hidden=displayFilter!=='all'&&a.kind!==displayFilter;card.tabIndex=0;card.setAttribute('role','group');card.setAttribute('aria-label',a.title);card.classList.toggle('selected',a.selected);
      const check=document.createElement('input');check.type='checkbox';check.checked=a.selected;check.disabled=busy&&!scanning;a.checkbox=check;check.setAttribute('aria-label','选择 '+a.title);card.append(check);
      check.onclick=e=>{if(!canSelect()){e.preventDefault();return;}choose(a,e,check.checked);};
      card.onclick=e=>{if(e.target!==check)choose(a,e);};card.onkeydown=e=>{if(e.target===card&&(e.key===' '||e.key==='Enter')){e.preventDefault();choose(a,e);}};
      const badge=document.createElement('span');badge.className='badge '+a.kind;badge.textContent=a.kind==='scene'?'🎬 场景视频':a.kind==='video'?'▶ 视频':'▧ 图片';card.append(badge);
      refreshPreview(a);const body=document.createElement('div');body.className='body';const type=document.createElement('strong');type.textContent=a.kind==='scene'?'场景视频 · 完整导出':a.kind==='video'?`视频 ${a.resolution||''}`:'图片';const title=document.createElement('div');title.className='title';title.textContent=a.title;title.title=a.title;const status=document.createElement('div');status.className='status';status.textContent=a.status;a.statusNode=status;if(/[.…]$/.test(a.title.trim()))title.title=a.title+'（网页仅提供截断提示词，文件名将使用可读取部分）';body.append(type,title,status);card.append(body);list.append(card);
    }
    if(!visibleItems().length){const empty=document.createElement('div');empty.className='empty';empty.textContent='当前分类没有已识别素材';list.append(empty);}
    const values=[...items.values()],videos=values.filter(a=>a.kind==='video').length,scenes=values.filter(a=>a.kind==='scene').length;$('stats').textContent=`普通视频 ${videos} · 场景视频 ${scenes} · 图片 ${items.size-videos-scenes} · 合计 ${items.size}`;selection();
  }
  function state(a,s){a.status=s;if(a.statusNode)a.statusNode.textContent=s;}
  function setBusy(v){busy=v;for(const id of ['scan','current','download','prefer'])$(id).disabled=v;$('all').disabled=v&&!scanning;for(const mode of ['none','invert','image','video'])$(mode).disabled=v&&!scanning;for(const f of ['all','image','video','scene'])$('filter-'+f).disabled=v&&!scanning;$('stop').disabled=!v;$('stop').textContent=scanning?'停止扫描并保留结果':'停止后续任务';for(const e of root.querySelectorAll('.card input'))e.disabled=v&&!scanning;}
  async function scan(full){
    if(busy)return;scanning=true;setBusy(true);stop=false;finishDrag(true);selectionAnchor=null;items.clear();$('list').replaceChildren();project=location.href;
    const vp=viewport(),original=vp?.scrollTop||0;let finished=false,reason='扫描上限';
    try{
      if(!document.querySelector('flow-grid-tile-container'))throw Error('未找到 Flow 素材卡片，请进入项目并等待素材加载');
      // Render immediately, before the first asynchronous scroll/wait.
      collect();render();
      if(!full||!vp){finished=true;}
      else{
        vp.scrollTop=0;await sleep(450);
        let stable=0,stalled=0,lastSize=-1,lastHeight=-1,lastTop=-1;
        const deadline=Date.now()+5*60*1000;
        for(let step=0;step<1200&&!stop;step++){
          if(location.href!==project)throw Error('项目已切换，请重新扫描');
          collect();render();notice(`正在扫描：已显示 ${items.size} 项，可点击卡片勾选。`);
          const top=vp.scrollTop,height=vp.scrollHeight,bottom=top+vp.clientHeight>=height-4;
          const unchanged=items.size===lastSize&&Math.abs(height-lastHeight)<4;
          stable=bottom&&unchanged?stable+1:0;
          stalled=unchanged&&Math.abs(top-lastTop)<2?stalled+1:0;
          if(stable>=4){finished=true;break;}
          if(stalled>=8){reason='滚动未继续移动，已保留已识别结果';break;}
          if(Date.now()>deadline){reason='已达到 5 分钟扫描上限';break;}
          lastSize=items.size;lastHeight=height;lastTop=top;
          vp.scrollTop=Math.min(top+Math.max(100,vp.clientHeight*.7),Math.max(0,height-vp.clientHeight));
          await sleep(bottom?700:450);
        }
      }
      notice(`${finished?'扫描完成':stop?'扫描已停止':reason}：${items.size} 项。${finished?'':'仅代表已扫描部分。'}生成中、失败素材和组内隐藏版本不包含在内。提示词末尾为省略号时，文件名只能使用网页提供的部分。`);
    }catch(e){notice(e.message);}finally{if(vp)vp.scrollTop=original;scanning=false;setBusy(false);render();}
  }
  async function until(fn,ms=5000){const end=Date.now()+ms;while(Date.now()<end){const v=fn();if(v)return v;await sleep(100);}return null;}
  function findTile(a){
    return [...document.querySelectorAll('flow-grid-tile-container')].find(t=>{const b=asset(t);return b&&b.kind===a.kind&&(b.key===a.key||(a.id&&b.id&&a.id===b.id)||((!a.id||!b.id)&&a.slot===b.slot&&a.title===b.title));});
  }
  async function locate(a){
    let t=findTile(a);if(t)return t;const vp=viewport();if(!vp)throw Error('素材不在当前列表，请重新扫描');
    vp.scrollTop=a.top;await sleep(600);t=findTile(a);if(t)return t;
    vp.scrollTop=0;await sleep(500);
    for(let n=0;n<1500;n++) {if(stop)throw Error('已停止');t=findTile(a);if(t)return t;if(vp.scrollTop+vp.clientHeight>=vp.scrollHeight-2)break;vp.scrollTop+=Math.max(100,vp.clientHeight*.7);await sleep(350);}
    throw Error('找不到素材，可能已删除或列表已改变');
  }
  function menuButtons(){return [...document.querySelectorAll('[role="menu"] button[role="menuitem"]')].filter(visible);}
  function closeMenus(){const backs=[...document.querySelectorAll('.cdk-overlay-backdrop')].filter(visible);backs.at(-1)?.click();}
  async function sceneDownloadButton(a){
    closeMenus();state(a,'打开场景编辑页…');const tile=await locate(a);
    const scene=tile.querySelector('flow-scene-tile');if(!scene)throw Error('所选项不是场景视频');
    (scene.querySelector('.tile-container')||scene).click();
    const builder=await until(()=>document.querySelector('flow-scene-builder'),15000);
    if(!builder)throw Error('场景编辑页未打开，未下载任何片段');
    const active=builder.querySelector('flow-navigation-rail button.thumbnail-button.active')?.getAttribute('aria-label');
    if(active&&active!==a.title)throw Error('当前打开的场景与所选项不一致，已停止');
    state(a,'等待完整场景下载按钮可用…');
    const deadline=Date.now()+90000;let heartbeat=Date.now();
    while(Date.now()<deadline){
      if(stop)throw Error('已停止场景下载');
      if(!document.querySelector('flow-scene-builder'))throw Error('场景编辑页已关闭');
      const button=builder.querySelector('flow-editor-header button[aria-label="下載場景"],flow-editor-header button[aria-label="下载场景"],flow-editor-header button[aria-label="Download scene"]');
      if(button&&!disabled(button))return button;
      if(Date.now()-heartbeat>20000){await msg({type:'BEGIN'});heartbeat=Date.now();}
      await sleep(350);
    }
    throw Error('“下载场景”按钮仍处于禁用或处理中状态，未重复点击');
  }
  async function downloadScene(a,folder,index){
    const original=location.href,originalTop=viewport()?.scrollTop||0;
    try{await downloadOne(a,'完整场景',folder,index);}
    finally{
      if(document.querySelector('flow-scene-builder')){
        const back=document.querySelector('flow-scene-builder flow-navigation-header button.back-button');
        if(!back||disabled(back)){stop=true;throw Error('无法返回素材列表。已停止后续任务，请手动返回；请查看浏览器确认当前文件是否已完成。');}
        back.click();
      }
      const returned=await until(()=>!document.querySelector('flow-scene-builder')&&location.href===original&&document.querySelector('flow-grid-tile-container'),15000);
      if(!returned){stop=true;throw Error('未能确认返回原素材列表，已停止后续任务，避免下载错误素材。');}
      if(viewport())viewport().scrollTop=originalTop;
    }
  }
  async function optionFor(a,quality){
    if(a.kind==='scene')return sceneDownloadButton(a);
    closeMenus();await sleep(120);const tile=await locate(a);const fresh=asset(tile);if(fresh){a.url=fresh.url||a.url;a.id=fresh.id||a.id;}tile.scrollIntoView({block:'nearest'});
    tile.dispatchEvent(new MouseEvent('mouseover',{bubbles:true}));tile.dispatchEvent(new MouseEvent('mouseenter',{bubbles:false}));
    const more=tile.querySelector('button[aria-label="更多選項"],button[aria-label="更多选项"],button[aria-label="More options"]')||[...tile.querySelectorAll('button')].find(b=>text(b.querySelector('mat-icon'))==='more_vert');
    if(!more)throw Error('未找到素材菜单按钮');more.click();
    const download=await until(()=>menuButtons().find(b=>['下載','下载','Download'].includes(text(b.querySelector('.label')))));
    if(!download)throw Error('未找到下载菜单');download.dispatchEvent(new MouseEvent('mouseenter',{bubbles:false}));download.dispatchEvent(new MouseEvent('mouseover',{bubbles:true}));download.click();
    const match=b=>a.kind==='video'?['原始大小','Original size','Original'].includes(text(b.querySelector('.caption'))):text(b.querySelector('.label')).toUpperCase()===quality;
    const opt=await until(()=>menuButtons().find(match));
    if(!opt||disabled(opt)){const e=Error(quality==='2K'?'2K 不可用':'未找到可用的原始大小／1K');e.fallback=quality==='2K';throw e;}
    return opt;
  }
  window.addEventListener('message',e=>{
    if(e.source!==window||e.origin!==location.origin||e.data?.channel!=='FLOW_DL_BRIDGE'||!currentCapture||e.data.token!==currentCapture.token)return;
    if(e.data.type==='READY')currentCapture.ready=true;
    if(e.data.type==='CAPTURE')currentCapture.result=e.data;
  });
  async function downloadOne(a,quality,folder,index){
    let token,url,downloadId;try{
      state(a,`准备 ${quality}…`);const option=await optionFor(a,quality);
      token=crypto.randomUUID();currentCapture={token,ready:false,result:null};control({type:'ARM',token,timeoutMs:a.kind==='scene'?300000:90000});
      if(!await until(()=>currentCapture?.ready,2500))throw Error('下载链接捕获器未就绪，请刷新 Flow 页面');
      const base=a.title;
      if(a.kind!=='scene'&&a.url?.startsWith('https:'))await msg({type:'EXPECT',token,url:a.url,kind:a.kind,folder,base});
      state(a,`获取 ${quality} 下载链接…`);option.click();
      let capture,r,nativeUsed=false;
      const captureDeadline=Date.now()+(a.kind==='scene'?300000:60000);let heartbeat=Date.now();
      while(Date.now()<captureDeadline){
        if(Date.now()-heartbeat>20000){await msg({type:'BEGIN'});heartbeat=Date.now();}
        capture=currentCapture?.result;
        if(capture)break;
        const n=await msg({type:'EXPECT_STATUS',token});
        if(n.id!==null){r={id:n.id};nativeUsed=true;break;}
        await sleep(350);
      }
      if(!capture&&!r)throw Error('未捕获可确认的下载任务，页面可能仍在处理。请检查浏览器下载列表，避免重复下载。');
      url=capture?.url;
      const native=async()=>{
        await msg({type:'ARM_NATIVE',url,folder,base});control({type:'NATIVE',token});
        const end=Date.now()+20000;while(Date.now()<end){const n=await msg({type:'NATIVE_STATUS'});if(n.id!==null)return {id:n.id};await sleep(300);}
        throw Error('原生下载尚未启动，请检查浏览器的保存提示');
      };
      if(!r){
        try{r=await msg({type:'DOWNLOAD',token,url,originalName:capture.name,kind:a.kind,folder,base});}
        catch(e){if(!url.startsWith('blob:'))throw e;nativeUsed=true;r=await native();}
      }
      downloadId=r.id;a.downloadId=r.id;lastDownload=r.id;$('show').disabled=false;
      const deadline=Date.now()+30*60*1000;
      while(Date.now()<deadline){
        const d=await msg({type:'STATUS',id:r.id});
        if(d.state==='complete'){if(!d.savedCorrect)throw Error('文件已下载，但目录不符合预期。实际位置：'+(d.filename||'未知')+'。请检查其他下载扩展或保存设置。');a.savedPath=d.filename;state(a,`已完成 · ${quality} · 已核对目录`);return;}
        if(d.state==='interrupted'&&!nativeUsed&&url?.startsWith('blob:')&&/^(SERVER_|NETWORK_)/.test(d.error||'')){
          nativeUsed=true;r=await native();downloadId=r.id;a.downloadId=r.id;lastDownload=r.id;continue;
        }
        if(d.state==='interrupted'||d.state==='missing'){const err=Error(d.error||'下载中断');err.fallback=quality==='2K'&&d.state==='interrupted'&&/^(SERVER_|NETWORK_)/.test(d.error||'');throw err;}
        state(a,`下载 ${quality} · ${d.total>0?Math.round(d.bytes/d.total*100)+'%':Math.round((d.bytes||0)/1024)+' KB'}`);await sleep(1000);
      }
      throw Error('下载仍未结束，请在浏览器下载列表检查；未重复下载');
    }catch(e){
      // Only explicit unavailable / confirmed network-server failures may fall back.
      if(!downloadId && url && quality==='2K' && /SERVER_|NETWORK_/.test(e.message))e.fallback=true;
      throw e;
    }finally{if(token){control({type:'DISARM',token});await msg({type:'CLEAR_EXPECT',token}).catch(()=>{});}if(url)control({type:'RELEASE',url});currentCapture=null;closeMenus();}
  }
  async function batchPause(){const ms=500+Math.floor(Math.random()*1001);await sleep(ms);}
  const folderName=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return `flow下载${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;};
  async function start(){
    if(busy)return;const selected=visibleItems().filter(a=>a.selected);if(!selected.length){notice('请先扫描并勾选素材');return;}if(location.href!==project){notice('项目已切换，请重新扫描');return;}
    setBusy(true);stop=false;const folder=folderName(),prefer=$('prefer').checked,original=viewport()?.scrollTop||0;let success=0,failed=0,owns=false;
    try{
      await msg({type:'BEGIN'});owns=true;
      for(let i=0;i<selected.length&&!stop;i++){
        if(location.href!==project)throw Error('项目已切换，批次已停止');const a=selected[i];notice(`正在处理 ${i+1}/${selected.length}\n保存目录：${folder}`);
        try{try{await (a.kind==='scene'?downloadScene(a,folder,i+1):downloadOne(a,a.kind==='video'?'原始大小':prefer?'2K':'1K',folder,i+1));}catch(e){if(a.kind==='image'&&prefer&&e.fallback&&!stop){state(a,'2K 不可用或失败，回退 1K…');await batchPause();if(stop)throw Error('已停止后续下载');await downloadOne(a,'1K',folder,i+1);}else throw e;}success++;}catch(e){failed++;state(a,'未完成：'+e.message);}
        if(i<selected.length-1&&!stop){notice(`已处理 ${i+1}/${selected.length}，短暂间隔后继续…\n保存目录：${folder}`);await batchPause();}
      }
      notice(`${stop?'已停止后续任务':'批次结束'}：成功 ${success}，未完成 ${failed}，未处理 ${selected.length-success-failed}。\n保存目录：${folder}`);
    }catch(e){notice(e.message);}finally{if(owns)await msg({type:'END'}).catch(()=>{});if(viewport())viewport().scrollTop=original;setBusy(false);}
  }
  $('scan').onclick=()=>scan(true);$('current').onclick=()=>showLoaded();$('download').onclick=start;$('close').onclick=()=>host.style.display='none';$('stop').onclick=()=>{stop=true;notice(scanning?'正在停止扫描，已发现的素材将保留。':'已请求停止：当前下载结束后不再处理下一项。');};$('show').onclick=()=>lastDownload&&msg({type:'SHOW',id:lastDownload});$('all').onchange=()=>selectMode($('all').checked?'all':'none');
  let selectionAnchor=null,drag=null,suppressClick=false,dragFrame=0;
  const canSelect=()=>!busy||scanning;
  function syncSelection(){
    for(const a of items.values()){
      if(a.checkbox)a.checkbox.checked=a.selected;
      if(a.card)a.card.classList.toggle('selected',a.selected);
    }
    selection();
  }
  function choose(a,e={},value){
    if(!canSelect()||suppressClick)return;
    const ordered=visibleItems(),from=ordered.findIndex(i=>i.key===selectionAnchor),to=ordered.indexOf(a);
    if(e.shiftKey&&from>=0){if(value!==false&&!e.ctrlKey&&!e.metaKey)for(const item of ordered)item.selected=false;for(let i=Math.min(from,to);i<=Math.max(from,to);i++)ordered[i].selected=value??true;}
    else{a.selected=value??!a.selected;selectionAnchor=a.key;}
    syncSelection();
  }
  function selectMode(mode){
    if(!canSelect())return;
    for(const a of visibleItems())a.selected=mode==='all'?true:mode==='none'?false:mode==='invert'?!a.selected:a.kind===mode;
    syncSelection();
  }
  function finishDrag(cancel=false){
    if(!drag)return;
    if(cancel&&drag.moved){for(const a of items.values())a.selected=drag.before.get(a.key)||false;syncSelection();}
    const moved=drag.moved,pointerId=drag.id;drag=null;cancelAnimationFrame(dragFrame);$('rubberband').hidden=true;
    if($('list').hasPointerCapture?.(pointerId))$('list').releasePointerCapture(pointerId);
    if(moved){suppressClick=true;setTimeout(()=>suppressClick=false,0);}
  }
  function updateDrag(){
    if(!drag?.moved)return;
    const list=$('list'),box=list.getBoundingClientRect();
    const x=Math.max(box.left,Math.min(drag.clientX,box.right)),y=Math.max(box.top,Math.min(drag.clientY,box.bottom));
    const endX=x-box.left+list.scrollLeft,endY=y-box.top+list.scrollTop;
    const area={left:Math.min(drag.x,endX),right:Math.max(drag.x,endX),top:Math.min(drag.y,endY),bottom:Math.max(drag.y,endY)};
    for(const a of visibleItems()){
      const r=a.card.getBoundingClientRect();
      const left=r.left-box.left+list.scrollLeft,top=r.top-box.top+list.scrollTop;
      const hit=left<area.right&&left+r.width>area.left&&top<area.bottom&&top+r.height>area.top;
      a.selected=drag.toggle?(!!drag.before.get(a.key)!==hit):drag.add?(!!drag.before.get(a.key)||hit):hit;
    }
    syncSelection();
    const band=$('rubberband'),left=Math.max(box.left,area.left+box.left-list.scrollLeft),top=Math.max(box.top,area.top+box.top-list.scrollTop);
    band.hidden=false;Object.assign(band.style,{left:left+'px',top:top+'px',width:Math.max(0,Math.min(box.right,area.right+box.left-list.scrollLeft)-left)+'px',height:Math.max(0,Math.min(box.bottom,area.bottom+box.top-list.scrollTop)-top)+'px'});
  }
  function dragScroll(){
    if(!drag?.moved)return;
    const list=$('list'),box=list.getBoundingClientRect();
    const amount=drag.clientY<box.top+28?-14:drag.clientY>box.bottom-28?14:0;
    if(amount){list.scrollTop+=amount;updateDrag();}
    dragFrame=requestAnimationFrame(dragScroll);
  }
  function bindSelection(){
    const list=$('list');
    list.addEventListener('pointerdown',e=>{
      if(!canSelect()||e.button!==0||e.target.tagName==='INPUT'||e.offsetX>=list.clientWidth&&e.target===list)return;
      const box=list.getBoundingClientRect();
      drag={id:e.pointerId,x:e.clientX-box.left+list.scrollLeft,y:e.clientY-box.top+list.scrollTop,startX:e.clientX,startY:e.clientY,clientX:e.clientX,clientY:e.clientY,moved:false,before:new Map([...items].map(([k,a])=>[k,a.selected])),toggle:e.ctrlKey||e.metaKey,add:e.shiftKey};
    });
    list.addEventListener('pointermove',e=>{
      if(!drag||drag.id!==e.pointerId)return;
      drag.clientX=e.clientX;drag.clientY=e.clientY;
      if(!drag.moved&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<6)return;
      if(!drag.moved){drag.moved=true;list.setPointerCapture(e.pointerId);dragFrame=requestAnimationFrame(dragScroll);}
      e.preventDefault();updateDrag();
    });
    list.addEventListener('pointerup',()=>finishDrag());list.addEventListener('pointercancel',()=>finishDrag(true));
    list.addEventListener('lostpointercapture',()=>{if(drag)finishDrag(true);});
    list.addEventListener('scroll',()=>{if(drag?.moved)updateDrag();});
    root.addEventListener('keydown',e=>{
      if(!canSelect()||e.target.isContentEditable||['TEXTAREA','SELECT'].includes(e.target.tagName))return;
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='a'){e.preventDefault();e.stopPropagation();selectMode(e.shiftKey?'none':'all');return;}
      if(e.key==='Escape'&&drag){e.preventDefault();finishDrag(true);return;}
      const keys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'];
      if(!keys.includes(e.key)||!list.contains(e.target))return;
      const a=visibleItems();if(!a.length)return;
      const current=a.findIndex(i=>i.card===e.target||i.card.contains(e.target));
      const columns=Math.max(1,getComputedStyle(list).gridTemplateColumns.split(' ').length);
      let next=e.key==='Home'?0:e.key==='End'?a.length-1:Math.max(0,Math.min(a.length-1,Math.max(0,current)+(e.key==='ArrowLeft'?-1:e.key==='ArrowRight'?1:e.key==='ArrowUp'?-columns:columns)));
      e.preventDefault();a[next].card.focus({preventScroll:true});a[next].card.scrollIntoView({block:'nearest'});
      if(e.shiftKey){if(!selectionAnchor&&current>=0)selectionAnchor=a[current].key;choose(a[next],e,true);}
    });
    for(const mode of ['none','invert','image','video'])$(mode).onclick=()=>selectMode(mode);
    for(const f of ['all','image','video','scene'])$('filter-'+f).onclick=()=>{if(!canSelect())return;finishDrag();displayFilter=f;selectionAnchor=null;for(const key of ['all','image','video','scene'])$('filter-'+key).setAttribute('aria-pressed',String(key===f));render();};
  }
  function showLoaded(){
    if(busy||drag)return;
    if(project!==location.href){items.clear();$('list').replaceChildren();selectionAnchor=null;project=location.href;}
    collect();render();
    notice(items.size?`已自动显示 ${items.size} 项。可直接选择下载，或扫描完整列表。`:'等待 Flow 素材加载…');
  }
  bindSelection();
  let refreshTimer;
  const observer=new MutationObserver(()=>{
    if(refreshTimer)return;refreshTimer=setTimeout(()=>{refreshTimer=null;if(host.style.display!=='none'&&!busy&&!drag)showLoaded();},250);
  });
  if(document.body)observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['src','poster','data-poster','data-media-id','data-status']});
  chrome.runtime.onMessage.addListener((m,sender,reply)=>{
    if(m.type==='OPEN'||m.type==='TOGGLE'){
      if(!host.isConnected)document.documentElement.append(host);
      host.style.display=m.type==='OPEN'?'block':host.style.display==='none'?'block':'none';
      if(host.style.display!=='none'){showLoaded();$('list').focus({preventScroll:true});}
      reply({ok:true,visible:host.style.display!=='none'});
    }
  });
})();
