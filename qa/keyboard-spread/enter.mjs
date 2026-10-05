import assert from 'node:assert/strict';import fs from 'node:fs/promises';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');const results=[];
for(const [name,engine,opts]of [['chromium',chromium,{executablePath:'/usr/bin/chromium',args:['--no-sandbox']}],['webkit',webkit,{}]]){
 const browser=await engine.launch({headless:true,...opts});
 for(const viewport of [{width:402,height:874},{width:320,height:340}]){
  const context=await browser.newContext({viewport});const page=await context.newPage(),base=await context.newPage();await Promise.all([page.goto('http://127.0.0.1:5188'),base.goto('http://127.0.0.1:5186')]);await Promise.all([page.evaluate(()=>document.fonts.ready),base.evaluate(()=>document.fonts.ready)]);await page.waitForTimeout(150);await base.waitForTimeout(150);
  const measure=p=>p.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,width:r.width,height:r.height}};return {enter:rect('.key-enter'),row5:rect('.key-1'),row6:rect('.key-0'),fonts:[...document.querySelectorAll('.key-cap,.legend-f,.legend-g')].map(e=>getComputedStyle(e).font),spread:Number(document.querySelector('.calculator').dataset.keyboardDownwardSpread||0)}});
  const after=await measure(page),before=await measure(base);assert.deepEqual(after.fonts,before.fonts);assert.equal(after.enter.width,before.enter.width);assert.ok(Math.abs(after.enter.height-before.enter.height-after.spread/6)<.035);assert.ok(Math.abs(after.enter.top-after.row5.top)<.035);assert.ok(Math.abs(after.enter.bottom-after.row6.bottom)<.035);results.push({engine:name,viewport,before:before.enter,after:after.enter,topError:after.enter.top-after.row5.top,bottomError:after.enter.bottom-after.row6.bottom,fontMetricsPreserved:true,passed:true});await context.close();
 }await browser.close();
}
await fs.writeFile(new URL('enter-results.json',import.meta.url),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
