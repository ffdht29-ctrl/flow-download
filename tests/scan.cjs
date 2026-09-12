const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../content.js'),'utf8');
class Element {
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.style={};this.classes=new Set();this.classList={toggle:(name,on)=>on?this.classes.add(name):this.classes.delete(name)};}
 append(...a){this.children.push(...a)} replaceChildren(){this.children=[]} querySelector(){return null} setAttribute(k,v){this[k]=v}
}
function setup(stuck=false){
 const els={list:new Element(),stats:new Element(),selection:new Element(),all:new Element()};let top=0,clock=0,waits=0;const renders=[],messages=[];
 const vp={clientHeight:400,scrollHeight:1200,get scrollTop(){return top},set scrollTop(n){if(!stuck)top=Math.max(0,Math.min(n,800));}};
 const tiles=()=>Array.from({length:20},(_,i)=>({key:'image:'+i,id:''+i,kind:i===0?'video':'image',title:'prompt '+i,url:'https://example.test/'+i,preview:'https://example.test/preview/'+i}));
 const s={displayFilter:'all',visibleItems:()=>[...s.items.values()],canSelect:()=>!s.busy||s.scanning,selectionAnchor:null,finishDrag:()=>{},items:new Map(),busy:false,scanning:false,stop:false,project:'',location:{href:'https://labs.google/project/test'},document:{querySelector:()=>({}),querySelectorAll:()=>tiles(),createElement:t=>new Element(t)},asset:t=>({...t}),$:id=>els[id],viewport:()=>vp,notice:t=>messages.push(t),setBusy:v=>s.busy=v,Date:{now:()=>clock},sleep:async ms=>{assert(renders.length>0,'results must render before first wait');clock+=ms;waits++;},console};
 vm.createContext(s);
 vm.runInContext(src.slice(src.indexOf('  function syncSelection()'),src.indexOf('  function finishDrag(')),Object.assign(s,{suppressClick:false}));
 vm.runInContext(src.slice(src.indexOf('  function collect()'),src.indexOf('  function state(')),s);
 vm.runInContext('const originalRender=render;render=()=>{originalRender();recordRender(items.size)}',Object.assign(s,{recordRender:n=>renders.push(n)}));
 vm.runInContext(src.slice(src.indexOf('  async function scan('),src.indexOf('  async function until(')),s);
 return {s,els,renders,messages,vp,get waits(){return waits}};
}
(async()=>{
 let t=setup();await t.s.scan(true);assert.equal(t.s.items.size,20);assert.equal(t.els.list.children.length,20);assert.match(t.messages.at(-1),/扫描完成/);assert.equal(t.vp.scrollTop,0);assert.match(t.els.stats.textContent,/普通视频 1 · 场景视频 0 · 图片 19/);
 const a=t.s.items.get('image:1'),card=a.card,preview=card.children.find(n=>n.tagName==='IMG');
 card.onclick({target:preview});assert.equal(a.selected,false);assert.equal(a.checkbox.checked,false);
 card.onclick({target:preview});assert.equal(a.selected,true);assert.equal(a.checkbox.checked,true);
 card.onclick({target:a.checkbox});assert.equal(a.selected,true,'checkbox click not double toggled');a.checkbox.checked=false;a.checkbox.onclick({});assert.equal(a.selected,false);
 t.s.collect();t.s.render();assert.equal(t.s.items.get(a.key),a,'object identity preserved during scan');assert.equal(a.card,card);assert.equal(a.selected,false);assert.equal(t.els.list.children.length,20,'no duplicate cards');
 t.s.scanning=true;t.s.busy=true;card.onclick({target:preview});assert.equal(a.selected,true,'can select while scanning');
 t.s.scanning=false;card.onclick({target:preview});assert.equal(a.selected,true,'cannot change active download selection');
 console.log('PASS progressive rendering before wait, counts, whole-card toggle, checkbox, stable selection, no duplicate cards');
 t=setup(true);await t.s.scan(true);assert.match(t.messages.at(-1),/滚动未继续移动/);assert(t.waits<15);assert.equal(t.els.list.children.length,20);assert.equal(t.s.busy,false);console.log('PASS stalled scroll exits quickly and retains 20 visible items');
 t=setup();t.s.sleep=async()=>{t.s.stop=true};await t.s.scan(true);assert.match(t.messages.at(-1),/扫描已停止/);assert.equal(t.s.items.size,20);console.log('PASS stop retains detected results');
})().catch(e=>{console.error(e);process.exitCode=1});
