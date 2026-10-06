import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/mrpir/AppData/Local/Temp/hp12c-perf-tools/node_modules/playwright');
const engine=process.env.TEST_ENGINE||'chromium';
const browser=await (engine==='webkit'?webkit:chromium).launch(engine==='webkit'?{headless:true}:{headless:true,executablePath:process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const results=[];
for(const viewport of [{width:402,height:874},{width:1280,height:800}]){
 const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>{
  localStorage.setItem('hp12c-history-v1',JSON.stringify(Array.from({length:100},(_,i)=>({id:'perf'+i,time:new Date().toISOString(),operation:'2 + 3',display:'5',value:5}))));
  window.metrics={reads:0,heights:0,frames:[],costs:[]};
  const style=window.getComputedStyle;window.getComputedStyle=function(el,...args){if(el.matches?.('.hp-menu,.history-board,.pull-preview'))window.metrics.reads++;return style.call(this,el,...args)};
  const height=Object.getOwnPropertyDescriptor(Element.prototype,'clientHeight');Object.defineProperty(Element.prototype,'clientHeight',{...height,get(){if(this.matches?.('.hp-menu,.history-board'))window.metrics.heights++;return height.get.call(this)}});
  let previous;const tick=t=>{if(previous&&document.querySelector('.hp-menu,.history-board'))window.metrics.frames.push(t-previous);previous=t;requestAnimationFrame(tick)};requestAnimationFrame(tick);
 });
 await page.goto('http://127.0.0.1:5198');await page.waitForFunction(()=>document.querySelector('.calculator')?.classList.contains('joined-frame'));await page.evaluate(()=>document.fonts.ready);
 const geometry=()=>page.evaluate(()=>Object.fromEntries(['.lcd','.keys','.portrait-footer-frame'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return[s,[r.x,r.y,r.width,r.height]]})));
 const before=await geometry();
 const open=async kind=>{await page.locator('.brand').click();await page.waitForTimeout(290);if(kind==='memory'){await page.getByRole('button',{name:'Histórico de cálculos',exact:true}).click();await page.getByRole('button',{name:'Abrir quadro negro',exact:true}).click();await page.locator('.history-board').waitFor();assert.equal(await page.locator('.history-board li').count(),100)}};
 const selector=kind=>kind==='memory'?'.history-board':'.hp-menu';
 const close=async kind=>{await page.keyboard.press('Escape');await page.locator(selector(kind)).waitFor({state:'detached'})};
 await open('menu');await close('menu');await page.evaluate(()=>{metrics.reads=0;metrics.heights=0;metrics.frames=[]});
 for(const kind of ['menu','memory'])for(let i=0;i<6;i++){await open(kind);await page.waitForTimeout(290);await close(kind)}
 const measured=await page.evaluate(()=>({...metrics}));
 // Short return, reversal, cancellation, fling and repeated gestures in both directions.
 for(const kind of ['menu','memory']){
  await open(kind);await page.waitForTimeout(290);
  const s=selector(kind),sign=kind==='memory'?-1:1;
  const drag=async(offset,cancel=false,reverse=false)=>{const r=await page.locator(s).boundingBox();const x=r.x+r.width/2,y=r.y+90;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y+sign*offset,{steps:5});if(reverse)await page.mouse.move(x,y,{steps:5});if(cancel)await page.evaluate(()=>window.dispatchEvent(new PointerEvent('pointercancel',{pointerId:1,bubbles:true})));await page.mouse.up()};
  await drag(10);await page.waitForTimeout(190);assert.equal(await page.locator(s).count(),1);
  await drag(70,false,true);await page.waitForTimeout(190);assert.equal(await page.locator(s).count(),1);
  await drag(60,true);await page.waitForTimeout(190);assert.equal(await page.locator(s).count(),1);
  await drag(110);await page.locator(s).waitFor({state:'detached'});
 }
 await page.emulateMedia({reducedMotion:'reduce'});await open('menu');await close('menu');await open('memory');
 await page.screenshot({path:new URL(`${engine}-${viewport.width}-memory.png`,import.meta.url).pathname.replace(/^\/(\w:)/,'$1')});await close('memory');
 assert.deepEqual(await geometry(),before);assert.deepEqual(errors,[]);
 const frames=measured.frames.sort((a,b)=>a-b);results.push({viewport,reads:measured.reads,heights:measured.heights,frameCount:frames.length,medianFrameMs:frames[Math.floor(frames.length*.5)],p95FrameMs:frames[Math.floor(frames.length*.95)],over8_33ms:frames.filter(x=>x>8.34).length,geometryPreserved:true,rows100:true,gestures:true,reducedMotion:true,errors});await page.close();
}
await browser.close();await fs.writeFile(new URL((process.argv[2]||'results')+'.json',import.meta.url),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
