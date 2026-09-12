const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../content.js'),'utf8');
function card({y=0,id='',pending=false,status='',ready=true,player=false,poster=''}={}){
 const state={y,id,pending,status,ready,player,poster,url:''};
 const video={get currentSrc(){return state.url},get poster(){return state.poster},getAttribute:n=>n==='src'?state.url:n==='data-media-id'?state.id:n==='poster'?state.poster:'',querySelector:()=>null};
 const container={getAttribute:n=>n==='data-status'?state.status:n==='data-media-id'?state.id:'',querySelector:q=>q==='video'?(state.player?video:null):q.startsWith('flow-video-hotbar')?(state.ready?{}:null):q==='img'&&state.poster?{getAttribute:()=>state.poster}:null};
 const tile={state,getBoundingClientRect:()=>({top:state.y,left:0}),getAttribute:()=>'',querySelector:q=>q.startsWith('flow-pending')?(state.pending?{}:null):q==='flow-video-tile'?container:null};return tile;
}
const vp={scrollTop:0,getBoundingClientRect:()=>({top:0,left:0})};let cards=[];
const s={items:new Map(),viewport:()=>vp,promptText:()=> '相同提示词',text:()=>'',URL,document:{querySelectorAll:()=>cards}};vm.createContext(s);
vm.runInContext(src.slice(src.indexOf('  function mediaURL('),src.indexOf('  function refreshPreview(')),s);
let t=card({ready:true,poster:'https://example.test/cover.png'});cards=[t];s.collect();assert.equal(s.items.size,1);
let a=[...s.items.values()][0];assert.equal(a.kind,'video');assert.equal(a.url,'');assert.equal(a.preview,'https://example.test/cover.png');a.selected=false;const originalKey=a.key;
t.state.player=true;t.state.url='https://flow-content.google/video/video-one?signature=x';s.collect();assert.equal(s.items.size,1);assert.equal(a.key,originalKey);assert.equal(a.id,'video-one');assert.equal(a.selected,false);assert(a.url.includes('video-one'));
// Recycled virtual list DOM can lose the player URL; retain the known address.
t.state.player=false;t.state.url='';s.collect();assert.equal(s.items.size,1);assert(a.url.includes('video-one'));
const second=card({y:250,ready:true});cards.push(second);s.collect();assert.equal(s.items.size,2,'same prompt with a different location is separate');
for(const c of [card({pending:true}),card({status:'generating'}),card({status:'failed'}),card({ready:false})])assert.equal(s.asset(c),null);
assert(s.asset(card({ready:false,player:true})),'ready player does not require src');assert(s.asset(card({ready:false,status:'completed'})),'explicit completed state sufficient');
console.log('PASS ready video without src, immediate cover, later ID merge, preserved selection, no duplicates, pending/failed exclusion');
// Actual preview updater swaps placeholder to cover without recreating the card.
function el(tag){return {tagName:tag,style:{},replaceWith(n){this.replacement=n}};}
s.document.createElement=el;vm.runInContext(src.slice(src.indexOf('  function refreshPreview('),src.indexOf('  function selection(')),s);
const previews=[],b={kind:'video',url:'',preview:'',title:'demo',card:{append:n=>previews.push(n)}};s.refreshPreview(b);const placeholder=b.previewNode;assert.equal(placeholder.tagName,'div');b.preview='https://example.test/new-cover.png';s.refreshPreview(b);assert.equal(placeholder.replacement.tagName,'img');const cover=b.previewNode;s.refreshPreview(b);assert.equal(b.previewNode,cover);
console.log('PASS placeholder upgrades to cover once without reloading unchanged preview');

// Download still captures the real menu URL when playback URL was initially empty.
const requests=[],d={currentCapture:null,lastDownload:null,crypto:{randomUUID:()=> 'job'},state:()=>{},optionFor:async()=>({click:()=>{d.currentCapture.result={url:'https://flow-content.google/video/real-file',name:'clip.mp4'}}}),control:m=>{if(m.type==='ARM')d.currentCapture.ready=true},until:async f=>f(),msg:async m=>{requests.push(m);if(m.type==='DOWNLOAD')return {id:7};if(m.type==='STATUS')return {state:'complete',savedCorrect:true,filename:'Downloads/folder/clip.mp4'};return {}},$:()=>({}),closeMenus:()=>{},sleep:async()=>{},Date};vm.createContext(d);
vm.runInContext(src.slice(src.indexOf('  async function downloadOne('),src.indexOf('  async function batchPause(')),d);
(async()=>{await d.downloadOne({kind:'video',title:'prompt',url:''},'原始大小','folder',1);assert(!requests.some(r=>r.type==='EXPECT'));assert.equal(requests.find(r=>r.type==='DOWNLOAD').url,'https://flow-content.google/video/real-file');console.log('PASS initially URL-less video downloads through captured real menu URL');})().catch(e=>{console.error(e);process.exitCode=1});
