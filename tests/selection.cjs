const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../content.js'),'utf8');
const list={scrollLeft:0,scrollTop:0,clientWidth:300,getBoundingClientRect:()=>({left:0,top:0,right:300,bottom:200}),contains:()=>true};
const band={hidden:true,style:{}},events={};
const items=new Map(Array.from({length:6},(_,i)=>[String(i),{key:String(i),kind:i%2?'video':'image',selected:false,checkbox:{},card:{classList:{toggle(){}},getBoundingClientRect:()=>({left:i%3*100,top:Math.floor(i/3)*100-list.scrollTop,width:90,height:90})}}]));
const s={displayFilter:'all',visibleItems:()=>[...items.values()].filter(a=>s.displayFilter==='all'||a.kind===s.displayFilter),items,selectionAnchor:null,suppressClick:false,drag:null,busy:false,scanning:false,selection(){},canSelect:()=>true,$:id=>id==='list'?list:id==='rubberband'?band:{},document:{},getComputedStyle:()=>({gridTemplateColumns:'100px 100px 100px'})};
vm.createContext(s);vm.runInContext(source.slice(source.indexOf('  function syncSelection()'),source.indexOf('  function finishDrag(')),s);
const values=()=>[...items.values()],selected=()=>values().filter(a=>a.selected).map(a=>a.key);
s.choose(values()[1],{});s.choose(values()[4],{shiftKey:true});assert.deepEqual(selected(),['1','2','3','4']);
s.choose(values()[0],{});assert.deepEqual(selected(),['0','1','2','3','4']);s.choose(values()[2],{shiftKey:true});assert.deepEqual(selected(),['0','1','2']);
s.selectMode('none');s.choose(values()[5],{});s.choose(values()[3],{shiftKey:true,ctrlKey:true});assert.deepEqual(selected(),['3','4','5']);
s.selectMode('image');assert.deepEqual(selected(),['0','2','4']);s.selectMode('invert');assert.deepEqual(selected(),['1','3','5']);s.selectMode('none');assert.deepEqual(selected(),[]);
vm.runInContext(source.slice(source.indexOf('  function updateDrag()'),source.indexOf('  function dragScroll(')),s);
s.drag={moved:true,x:0,y:0,clientX:195,clientY:95,before:new Map(values().map(a=>[a.key,false])),toggle:false,add:false};s.updateDrag();assert.deepEqual(selected(),['0','1']);
s.drag.before=new Map(values().map(a=>[a.key,a.selected]));s.drag.toggle=true;s.updateDrag();assert.deepEqual(selected(),[]);
s.drag.toggle=false;s.drag.add=true;s.drag.before=new Map([['5',true]]);s.updateDrag();assert.deepEqual(selected(),['0','1','5']);
list.scrollTop=100;s.drag.add=false;s.drag.x=0;s.drag.y=0;s.drag.clientX=195;s.drag.clientY=90;s.updateDrag();assert.deepEqual(selected(),['0','1','3','4']);assert.equal(band.style.height,'90px');
// Bind the actual keyboard handler, then send Ctrl+A / Ctrl+Shift+A.
list.addEventListener=(type,fn)=>events['list:'+type]=fn;s.root={addEventListener:(type,fn)=>events[type]=fn};s.finishDrag=()=>{};
vm.runInContext(source.slice(source.indexOf('  function bindSelection()'),source.indexOf('  function showLoaded(')),s);s.bindSelection();
let prevented=0;events.keydown({ctrlKey:true,key:'a',target:{tagName:'DIV'},preventDefault(){prevented++},stopPropagation(){}});assert.equal(selected().length,6);
events.keydown({ctrlKey:true,shiftKey:true,key:'a',target:{tagName:'DIV'},preventDefault(){prevented++},stopPropagation(){}});assert.equal(selected().length,0);assert.equal(prevented,2);
// Filtering limits selection to visible media and keeps hidden selections intact.
s.selectMode('none');values()[1].selected=true;s.displayFilter='image';s.selectMode('all');assert.deepEqual(selected(),['0','1','2','4']);
s.selectMode('none');assert.deepEqual(selected(),['1']);s.displayFilter='all';s.selectMode('none');
console.log('PASS filtered selection preserves hidden selection');
console.log('PASS Shift range, Ctrl+Shift addition, invert/type selection, rectangle replace/add/toggle, scrolled rectangle, Ctrl+A and Ctrl+Shift+A');
// Actual pause helper: each value stays in requested 500–1500 ms bounds.
const waits=[];let random=0;const pace={sleep:async ms=>waits.push(ms),Math:{floor:Math.floor,random:()=>random}};vm.createContext(pace);
vm.runInContext(source.slice(source.indexOf('  async function batchPause()'),source.indexOf('  const folderName=')),pace);
(async()=>{await pace.batchPause();random=.5;await pace.batchPause();random=.999999;await pace.batchPause();assert.deepEqual(waits,[500,1000,1500]);console.log('PASS random batch pause bounds: 500 / 1000 / 1500 ms');})().catch(e=>{console.error(e);process.exitCode=1});
