import { chromium } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const samples={cold:[],warm:[],pointer:[],keyboard:[],draw:[],storage:[],events:[],frames:[]};
const stats=a=>{a.sort((a,b)=>a-b);return {n:a.length,median:a[Math.floor(a.length/2)],p95:a[Math.min(a.length-1,Math.ceil(a.length*.95)-1)]}};
async function instrument(page){await page.addInitScript(()=>{
 window.hpMeasure={draw:[],storage:[],events:[],frames:[]};
 const original=CanvasRenderingContext2D.prototype.fill;
 CanvasRenderingContext2D.prototype.fill=function(...args){const t=performance.now();try{return original.apply(this,args)}finally{hpMeasure.draw.push(performance.now()-t)}};
 const set=Storage.prototype.setItem;Storage.prototype.setItem=function(...args){const t=performance.now();try{return set.apply(this,args)}finally{hpMeasure.storage.push(performance.now()-t)}};
 new PerformanceObserver(list=>{for(const e of list.getEntries())hpMeasure.events.push({name:e.name,duration:e.duration,processing:e.processingEnd-e.processingStart,inputDelay:e.processingStart-e.startTime})}).observe({type:'event',durationThreshold:16,buffered:true});
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('.key'))return;const t=performance.now();requestAnimationFrame(()=>requestAnimationFrame(()=>hpMeasure.frames.push(performance.now()-t)))},true);
 document.addEventListener('keydown',e=>{const t=performance.now();requestAnimationFrame(()=>requestAnimationFrame(()=>hpMeasure.frames.push(performance.now()-t)))},true);
 });}
for(let rep=0;rep<15;rep++){
 const context=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:3,hasTouch:true,isMobile:true,serviceWorkers:'block'});const page=await context.newPage();await instrument(page);
 await page.goto('http://127.0.0.1:4173/');await page.waitForSelector('.calculator.joined-frame');await page.evaluate(()=>document.fonts.ready);samples.cold.push(await page.evaluate(()=>performance.now()));
 await page.reload();await page.waitForSelector('.calculator.joined-frame');await page.evaluate(()=>document.fonts.ready);samples.warm.push(await page.evaluate(()=>performance.now()));
 await page.waitForTimeout(150);
 for(const id of ['2','enter','3','plus','clx','2','5','n','1','i','1','0','0','0','chs','pv','0','fv','pmt']){const t=performance.now();await page.locator('.key-'+id).tap();samples.pointer.push(performance.now()-t)}
 for(const key of ['Escape','2','Enter','3','+','Escape','1','2','3','4','5','6','7','8','9','0']){const t=performance.now();await page.keyboard.press(key);samples.keyboard.push(performance.now()-t)}
 await page.waitForTimeout(700);const m=await page.evaluate(()=>hpMeasure);samples.draw.push(...m.draw);samples.storage.push(...m.storage);samples.events.push(...m.events);samples.frames.push(...m.frames);
 if(rep===0)await page.screenshot({path:'/tmp/hp-baseline.png'});await context.close();
}
const report={commit:'54663a0197a57903cebc994241eb51516d5e65f8',version:'0.2.55',date:new Date().toISOString(),environment:{browser:await browser.version(),platform:os.platform(),arch:os.arch(),cpu:os.cpus()[0].model,viewport:'393x852 DPR3 touch emulated',physicalIphone:false},method:'15 fresh browser contexts; service worker blocked; reload in same context warm HTTP cache. Sequential real Chromium touchscreen taps and keyboard events. RPC action time includes Playwright overhead. Double RAF is paint opportunity proxy, not actual presentation timestamp. Canvas fill times exclude full LCD drawing. Storage writes exclude JSON serialization. Event Timing rounded by browser and threshold 16ms.',results:{coldReadyMs:stats(samples.cold),warmReadyMs:stats(samples.warm),tapRpcMs:stats(samples.pointer),keyboardRpcMs:stats(samples.keyboard),inputToDoubleRafMs:stats(samples.frames),canvasFillMs:stats(samples.draw),storageSetItemMs:stats(samples.storage),eventDurationMs:stats(samples.events.map(e=>e.duration)),eventProcessingMs:stats(samples.events.map(e=>e.processing)),eventInputDelayMs:stats(samples.events.map(e=>e.inputDelay))},raw:samples};fs.writeFileSync('/tmp/hp-baseline.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,raw:undefined},null,2));await browser.close();
