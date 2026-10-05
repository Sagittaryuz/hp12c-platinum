import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const results=[];
for(const [name,engine,opts] of [['chromium',chromium,{executablePath:'/usr/bin/chromium',args:['--no-sandbox']}],['webkit',webkit,{}]]){
 const browser=await engine.launch({headless:true,...opts});
 const cases=[[402,874,0],[402,874,34],[375,812,0],[430,932,0],[320,450,0]];
 for(const [width,height,safe] of cases)for(const dpr of [1,2,3]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,hasTouch:true});
  if(safe)await context.addInitScript(s=>{const observer=new MutationObserver(()=>{if(!document.head)return;observer.disconnect();const style=document.createElement('style');style.textContent='.calculator{--portrait-safe-bottom:'+s+'px!important}';document.head.appendChild(style)});observer.observe(document,{childList:true,subtree:true})},safe);
  const page=await context.newPage(),baseline=await context.newPage();
  await Promise.all([page.goto('http://127.0.0.1:5180'),baseline.goto('http://127.0.0.1:5184')]);
  await Promise.all([page.evaluate(()=>document.fonts.ready),baseline.evaluate(()=>document.fonts.ready)]);await page.waitForTimeout(150);await baseline.waitForTimeout(150);
  const measure=p=>p.evaluate(()=>{
   const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
   const query=s=>rect(document.querySelector(s));const el=document.querySelector('.portrait-footer-frame'),outer=getComputedStyle(el),inner=getComputedStyle(el,'::before');
   return {keys:[...document.querySelectorAll('.key')].map(e=>[e.className,rect(e)]),lcd:query('.lcd'),face:query('.lcd-face'),model:query('.model-name'),brand:query('.brand'),maker:query('.maker-name'),lettering:query('.maker-lettering'),panel:query('.keyboard-panel'),crossbar:query('.keyboard-crossbar'),silver:query('.silver-panel'),silverClip:getComputedStyle(document.querySelector('.silver-panel')).clipPath,frame:rect(el),outerLeft:outer.borderBottomLeftRadius,outerRight:outer.borderBottomRightRadius,innerLeft:inner.borderBottomLeftRadius,innerRight:inner.borderBottomRightRadius,insets:[inner.left,inner.right,inner.bottom],topInset:inner.top,rails:[getComputedStyle(document.querySelector('.maker-strip'),'::before').height,getComputedStyle(document.querySelector('.maker-strip'),'::after').height],oldFrame:getComputedStyle(document.querySelector('.keyboard-frame')).display,transitionCount:document.querySelectorAll('.footer-corner-transition').length,pointerEvents:outer.pointerEvents,font:getComputedStyle(document.querySelector('.maker-name')).font};
  });
  const a=await measure(page),b=await measure(baseline);
  for(const key of ['keys','lcd','face','model','brand','maker','lettering','panel','crossbar','silver','font'])assert.deepEqual(a[key],b[key],key);
  assert.equal(a.outerLeft,'44px');assert.equal(a.outerRight,'44px');assert.equal(a.innerLeft,'34px');assert.equal(a.innerRight,'34px');assert.deepEqual(a.insets,['10px','10px','10px']);assert.equal(a.topInset,'1px');assert.deepEqual(a.rails,['10px','10px']);assert.equal(a.oldFrame,'none');assert.equal(a.transitionCount,0);assert.equal(a.pointerEvents,'none');assert.equal(height-a.maker.bottom,10);assert.equal(height-a.frame.bottom,10);assert.ok(a.frame.height>88);assert.equal(a.frame.top,a.crossbar.bottom);assert.notEqual(a.silverClip,'none');
  const curveTop=a.frame.bottom-44;assert.ok(Math.max(...a.keys.filter(r=>r[1].width>0).map(r=>r[1].bottom))<curveTop,'keys stay above both arcs');
  const prefix=`${name}-${width}-safe${safe}-dpr${dpr}`;
  await page.screenshot({path:new URL(prefix+'-full.png',import.meta.url).pathname});
  await baseline.screenshot({path:new URL(prefix+'-before.png',import.meta.url).pathname});await page.screenshot({path:new URL(prefix+'-top.png',import.meta.url).pathname,clip:{x:0,y:a.crossbar.top-12,width,height:80}});const clips=[];
  for(const side of ['left','right']){const clip={x:side==='left'?0:width-72,y:height-88,width:72,height:88};await page.screenshot({path:new URL(prefix+'-'+side+'.png',import.meta.url).pathname,clip});clips.push({side,clip});}
  results.push({engine:name,viewport:{width,height},safeAreaSimulation:safe,dpr,passed:true,measurements:a,clips});await context.close();
 }
 for(const viewport of [{width:874,height:402},{width:1280,height:720}]){
  const context=await browser.newContext({viewport,deviceScaleFactor:3});const a=await context.newPage(),b=await context.newPage();await Promise.all([a.goto('http://127.0.0.1:5180'),b.goto('http://127.0.0.1:5184')]);await Promise.all([a.evaluate(()=>document.fonts.ready),b.evaluate(()=>document.fonts.ready)]);await a.waitForTimeout(200);await b.waitForTimeout(200);assert.deepEqual(await a.screenshot(),await b.screenshot());results.push({engine:name,viewport,dpr:3,landscapeByteIdentical:true,passed:true});await context.close();
 }
 await browser.close();
}
await fs.writeFile(new URL('visual-results.json',import.meta.url),JSON.stringify(results,null,2));console.log(`${results.length} visual cases passed; both corners at DPR 1/2/3, controls unchanged, actual crossbar/frame tops aligned, landscape identical.`);
