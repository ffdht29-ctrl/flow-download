const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const dir=path.join(__dirname,'..'),src=fs.readFileSync(path.join(dir,'content.js'),'utf8');
(async()=>{
const els={list:{replaceChildren(){},focus(){}}},item={key:'old',selected:false};let collected=0,rendered=0,ack;
const s={items:new Map([['old',item]]),project:'https://flow.google.com/project/1',location:{href:'https://flow.google.com/project/1'},busy:false,drag:null,selectionAnchor:null,collect:()=>collected++,render:()=>rendered++,notice:()=>{},$:id=>els[id],host:{isConnected:true,style:{display:'none'}},document:{documentElement:{append(){}}},chrome:{runtime:{onMessage:{addListener:f=>s.open=f}}}};
vm.createContext(s);vm.runInContext(src.slice(src.indexOf('  function showLoaded()'),src.indexOf('  bindSelection();')),s);
vm.runInContext(src.slice(src.lastIndexOf('  chrome.runtime.onMessage.addListener'),src.lastIndexOf('})();')),s);
s.open({type:'OPEN'},null,r=>ack=r);assert(ack.visible);assert.equal(collected,1);assert.equal(rendered,1);assert.equal(s.items.get('old').selected,false);
s.open({type:'OPEN'},null,r=>ack=r);assert(ack.visible);assert.equal(s.items.size,1,'reopening retains selection');
s.location.href='https://flow.google.com/project/2';s.open({type:'OPEN'},null,()=>{});assert.equal(s.items.size,0,'new project clears previous project cache');
s.busy=true;const before=collected;s.open({type:'OPEN'},null,()=>{});assert.equal(collected,before,'reopening does not disturb download');
console.log('PASS direct OPEN automatically renders, preserves selection, clears changed project, respects active download');
const bg=fs.readFileSync(path.join(dir,'background.js'),'utf8');
const events={},calls=[];let host='flow.google.com',cards=0;
const chrome={action:{onClicked:{addListener:f=>events.open=f},setBadgeText:async()=>{}},runtime:{onMessage:{addListener(){}},getURL:p=>'chrome-extension://id/'+p},downloads:{onDeterminingFilename:{addListener(){}}},tabs:{sendMessage:async(id,m)=>{calls.push(m);return {ok:true,visible:true}},create:async o=>calls.push(o)},scripting:{executeScript:async o=>{calls.push(o);return [{result:{host,cards}}]}}};
vm.runInNewContext(bg,{chrome,URL,Date});await events.open({id:1,url:'https://flow.google.com/project/1'});assert.equal(calls.at(-1).type,'OPEN');assert.equal(calls.filter(c=>c.files).length,2);
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json')));assert.equal(manifest.action.default_popup,undefined);assert(manifest.content_scripts.every(c=>c.matches.includes('https://flow.google.com/*')));
console.log('PASS no action popup; direct main panel on flow.google.com');
})().catch(e=>{console.error(e);process.exitCode=1});
