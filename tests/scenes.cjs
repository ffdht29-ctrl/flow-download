const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../content.js'),'utf8');
(async()=>{
 let inside=false,clock=0,waits=0,exports=0,backClicks=0;const requests=[];
 const location={href:'https://flow.google.com/project/one'},original=location.href;
 const option={get disabled(){return waits<2},click(){exports++;s.currentCapture.result={url:'https://flow-content.google/video/WHOLE-SCENE-export',name:'scene.mp4'}}};
 const builder={querySelector:q=>q.startsWith('flow-navigation-rail')?{getAttribute:()=> 'Scene A'}:q.startsWith('flow-editor-header')?option:null};
 const scene={querySelector:()=>({click(){inside=true;location.href=original+'/scene/a'}})};
 const back={click(){inside=false;backClicks++;location.href=original}};
 const s={location,stop:false,currentCapture:null,lastDownload:null,state(){},closeMenus(){},locate:async()=>({querySelector:()=>scene}),viewport:()=>({scrollTop:0}),document:{querySelector:q=>q==='flow-scene-builder'?(inside?builder:null):q.includes('back-button')?(inside?back:null):q==='flow-grid-tile-container'?(!inside?{}:null):null},disabled:b=>!b||b.disabled,Date:{now:()=>clock},sleep:async ms=>{clock+=ms;waits++},msg:async m=>{requests.push(m);if(m.type==='DOWNLOAD')return {id:1};if(m.type==='STATUS')return {state:'complete',savedCorrect:true,filename:'Downloads/flow-folder/Scene A.mp4'};return {}},crypto:{randomUUID:()=> 'scene-token'},control:m=>{if(m.type==='ARM')s.currentCapture.ready=true},$:()=>({})};
 s.until=async(fn,ms=5000)=>{const deadline=clock+ms;while(clock<deadline){const r=fn();if(r)return r;await s.sleep(100)}return null};
 vm.createContext(s);vm.runInContext(src.slice(src.indexOf('  async function sceneDownloadButton('),src.indexOf('  async function optionFor(')),s);
 vm.runInContext(src.slice(src.indexOf('  async function downloadOne('),src.indexOf('  async function batchPause(')),s);
 s.optionFor=a=>s.sceneDownloadButton(a);
 await s.downloadScene({kind:'scene',url:'',title:'Scene A'},'flow-folder',1);
 assert.equal(exports,1);assert.equal(backClicks,1);assert.equal(inside,false);assert(waits>=2);assert(!requests.some(r=>r.type==='EXPECT'));assert.equal(requests.find(r=>r.type==='DOWNLOAD').url,'https://flow-content.google/video/WHOLE-SCENE-export');assert.equal(requests.find(r=>r.type==='DOWNLOAD').kind,'scene');
 console.log('PASS scene open → wait enabled → full export button → captured whole export → back to list');
 // Failed or mismatched scene must not export a preview clip.
 builder.querySelector=q=>q.startsWith('flow-navigation-rail')?{getAttribute:()=> 'Wrong scene'}:option;
 await assert.rejects(s.downloadScene({kind:'scene',url:'',title:'Scene A'},'folder',2),/不一致/);assert.equal(exports,1);assert.equal(inside,false);
 console.log('PASS scene mismatch aborts export and returns safely');
 const c={URL,viewport:()=>({scrollTop:0,getBoundingClientRect:()=>({top:0,left:0})}),promptText:()=> 'Scene A'};vm.createContext(c);
 vm.runInContext(src.slice(src.indexOf('  function mediaURL('),src.indexOf('  function asset(')),c);
 const asset=c.sceneAsset({getAttribute:()=>'',getBoundingClientRect:()=>({top:10,left:10})},{getAttribute:()=>'',querySelector:q=>q.includes('--clip-thumbnail-url')?{getAttribute:()=> '--clip-thumbnail-url: url(https://flow-content.google/image/cover?x=1)'}:null,querySelectorAll:()=>[{getAttribute:()=> 'https://flow-content.google/video/clip1'},{getAttribute:()=> 'https://flow-content.google/video/clip2'}]});
 assert.equal(asset.kind,'scene');assert.equal(asset.url,'');assert(asset.preview.includes('/image/cover'));assert(!asset.preview.includes('/video/'));
 console.log('PASS scene preview never becomes export URL');
})();
