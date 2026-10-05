import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const results=[];
for(const [name,engine,opts] of [['chromium',chromium,{executablePath:'/usr/bin/chromium',args:['--no-sandbox']}],['webkit',webkit,{}]]){
 const browser=await engine.launch({headless:true,...opts});
 const cases=process.env.QA_CASES?JSON.parse(process.env.QA_CASES):[[402,874,0],[402,874,34],[375,812,0],[430,932,0],[320,450,0],[320,340,0]];
 for(const [width,height,safe] of cases)for(const dpr of [1,2,3]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,hasTouch:true});
  if(safe)await context.addInitScript(s=>{const observer=new MutationObserver(()=>{if(!document.head)return;observer.disconnect();const style=document.createElement('style');style.textContent='.calculator{--portrait-safe-bottom:'+s+'px!important}';document.head.appendChild(style)});observer.observe(document,{childList:true,subtree:true})},safe);
  const page=await context.newPage(),baseline=await context.newPage();
  await Promise.all([page.goto('http://127.0.0.1:5194'),baseline.goto('http://127.0.0.1:5193')]);
  await Promise.all([page.evaluate(()=>document.fonts.ready),baseline.evaluate(()=>document.fonts.ready)]);await page.waitForTimeout(150);await baseline.waitForTimeout(150);
  const measure=p=>p.evaluate(()=>{
   const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
   const query=s=>rect(document.querySelector(s));const el=document.querySelector('.portrait-footer-frame'),outer=getComputedStyle(el),inner=getComputedStyle(el,'::before');
   return {keys:[...document.querySelectorAll('.key')].map(e=>[e.className,rect(e)]),lcd:query('.lcd'),face:query('.lcd-face'),model:query('.model-name'),brand:query('.brand'),maker:query('.maker-name'),lettering:query('.maker-lettering'),panel:query('.keyboard-panel'),crossbar:query('.keyboard-crossbar'),silver:query('.silver-panel'),silverClip:getComputedStyle(document.querySelector('.silver-panel')).clipPath,frame:rect(el),outerLeft:outer.borderBottomLeftRadius,outerRight:outer.borderBottomRightRadius,innerLeft:inner.borderBottomLeftRadius,innerRight:inner.borderBottomRightRadius,insets:[inner.left,inner.right,inner.bottom],topInset:inner.top,rails:[getComputedStyle(document.querySelector('.maker-strip'),'::before').height,getComputedStyle(document.querySelector('.maker-strip'),'::after').height],spread:Number(document.querySelector('.calculator').dataset.keyboardDownwardSpread),groups:[...document.querySelectorAll('.bond,.depreciation,.clear,.prefix')].map(e=>({name:e.className,rect:rect(e),span:rect([...e.querySelectorAll('span')].find(s=>getComputedStyle(s).display!=='none'))})),legends:[...document.querySelectorAll('.key .legend-f')].map(e=>({key:e.parentElement.className,rect:rect(e),font:getComputedStyle(e).font})),oldFrame:getComputedStyle(document.querySelector('.keyboard-frame')).display,transitionCount:document.querySelectorAll('.footer-corner-transition').length,pointerEvents:outer.pointerEvents,font:getComputedStyle(document.querySelector('.maker-name')).font};
  });
  const a=await measure(page),b=await measure(baseline);
  for(const key of ['lcd','face','model','brand','maker','lettering','panel','silver','font'])assert.deepEqual(a[key],b[key],key);
  const ordinary=b.keys.filter(([name,r])=>r.width>0&&!name.includes('key-enter'));
  const rowTops=[...new Set(ordinary.map(([name,r])=>r.top))].sort((a,b)=>a-b);
  assert.equal(rowTops.length,7);const extra=a.spread-b.spread;assert.equal(extra,0);assert.ok(extra>=0&&extra<=10);const step=extra/6;
  assert.deepEqual(a.keys,b.keys);assert.deepEqual(a.groups,b.groups);const keyDiffs=[];const narrow=width===320;
  for(let i=0;i<a.keys.length;i++){const [name,r]=a.keys[i],before=b.keys[i][1];assert.equal(r.width,before.width,name+' width');if(!narrow){assert.equal(r.left,before.left);assert.equal(r.right,before.right);}assert.ok(Math.abs(r.height-before.height-(name.includes('key-enter')?step:0))<.035,name+' height');if(!r.width)continue;const row=rowTops.indexOf(before.top);const expected=name.includes('key-enter')?5*step:row*step;assert.ok(Math.abs((r.top-before.top)-expected)<.045,name+' vertical shift');keyDiffs.push({name,row,horizontalShift:r.left-before.left,shift:r.top-before.top,expected,height:r.height});}
  const enterRect=a.keys.find(([n])=>n.includes('key-enter'))[1];const rowFive=a.keys.find(([n])=>n.includes('key-1 '))[1],rowSix=a.keys.find(([n])=>n.includes('key-0 '))[1];assert.ok(Math.abs(enterRect.top-rowFive.top)<.045);assert.ok(Math.abs(enterRect.bottom-rowSix.bottom)<.045);
  const rowAfter=rowTops.map((top,i)=>a.keys.find(([name,r])=>name===ordinary.find(([n,r])=>r.top===top)[0])[1].top);
  const intervals=rowAfter.slice(1).map((top,i)=>({before:rowTops[i+1]-rowTops[i],after:top-rowAfter[i],gain:top-rowAfter[i]-(rowTops[i+1]-rowTops[i])}));for(const g of intervals)assert.ok(Math.abs(g.gain-step)<.045);
  for(let i=0;i<a.legends.length;i++){const x=a.legends[i],y=b.legends[i];assert.equal(x.font,y.font);const key=keyDiffs.find(k=>k.name===x.key);if(key)assert.ok(Math.abs(x.rect.top-y.rect.top-key.shift)<.045);}
  for(let i=0;i<a.groups.length;i++){const x=a.groups[i],y=b.groups[i];const expected=x.name.includes('prefix')?5*step:x.name.includes('clear')?1.5*step:.5*step;assert.ok(Math.abs(x.rect.top-y.rect.top-expected)<.045);assert.equal(x.rect.height,y.rect.height);if(!narrow)assert.equal(x.rect.width,y.rect.width);assert.ok(Math.abs((x.span.top-x.rect.top)-(y.span.top-y.rect.top))<.045);}
  const bottom=Math.max(...a.keys.filter(([n,r])=>r.width>0).map(([n,r])=>r.bottom));assert.ok(bottom<=height-safe-2+.035);assert.ok(a.maker.top-bottom>=10-.035);
  const innerLeft=a.frame.left+10,innerRight=a.frame.right-10,centreY=a.frame.bottom-50;
  const cornerClearances=[];
  for(const [name,r]of a.keys){if(!r.width)continue;assert.ok(r.left>=innerLeft);assert.ok(r.right<=innerRight);let bound=a.frame.bottom-10;for(const [x,cx,left]of [[r.left-1,innerLeft+40,true],[r.right+1,innerRight-40,false]])if(left?x<cx:x>cx)bound=Math.min(bound,centreY+Math.sqrt(Math.max(0,1600-(x-cx)**2)));assert.ok(bound-r.bottom>=.96,name+' corner');cornerClearances.push({name,clearance:bound-r.bottom});}
  const firstRow=a.keys.filter(([n,r])=>Math.abs(r.top-rowAfter[0])<.1&&r.width>0).map(([n,r])=>r).sort((a,b)=>a.left-b.left);const horizontalGaps=firstRow.slice(1).map((r,i)=>r.left-firstRow[i].right);assert.ok(horizontalGaps.every(x=>x>=10));
  assert.equal(a.outerLeft,'40px');assert.equal(a.outerRight,'40px');assert.equal(a.innerLeft,'30px');assert.equal(a.innerRight,'30px');assert.deepEqual(a.insets,['10px','10px','10px']);assert.equal(a.topInset,'1px');assert.deepEqual(a.rails,['10px','10px']);assert.equal(a.oldFrame,'none');assert.equal(a.transitionCount,0);assert.equal(a.pointerEvents,'none');assert.equal(height-a.maker.bottom,10);assert.equal(height-a.frame.bottom,10);assert.ok(a.frame.height>88);assert.ok(a.frame.width-20>=80);assert.ok(a.frame.height-11>=40);assert.equal(a.frame.top,a.crossbar.bottom);assert.equal(a.frame.left,10);assert.equal(a.frame.right,width-10);assert.equal(a.crossbar.left,10);assert.equal(a.crossbar.right,width-10);assert.equal(a.crossbar.height,10);assert.notEqual(a.silverClip,'none');
  
  const prefix=`${name}-${width}x${height}-safe${safe}-dpr${dpr}`;
  await page.screenshot({path:new URL(prefix+'-full.png',import.meta.url).pathname});
  await baseline.screenshot({path:new URL(prefix+'-before.png',import.meta.url).pathname});await page.screenshot({path:new URL(prefix+'-top.png',import.meta.url).pathname,clip:{x:0,y:a.crossbar.top-12,width,height:80}});const clips=[];
  for(const side of ['left','right']){const clip={x:side==='left'?0:width-72,y:height-88,width:72,height:88};await page.screenshot({path:new URL(prefix+'-'+side+'.png',import.meta.url).pathname,clip});clips.push({side,clip});}
  results.push({engine:name,viewport:{width,height},safeAreaSimulation:safe,dpr,passed:true,measurements:a,before:{keys:b.keys,maker:b.maker},distribution:{requestedExtra:10,extra,step,intervals,keyDiffs,horizontalGaps,cornerClearances,inscriptionClearance:a.maker.top-bottom},clips});await context.close();
 }
 for(const viewport of (process.env.QA_CASES?[]:[{width:874,height:402},{width:1280,height:720}])){
  const context=await browser.newContext({viewport,deviceScaleFactor:3});const a=await context.newPage(),b=await context.newPage();await Promise.all([a.goto('http://127.0.0.1:5194'),b.goto('http://127.0.0.1:5193')]);await Promise.all([a.evaluate(()=>document.fonts.ready),b.evaluate(()=>document.fonts.ready)]);await a.waitForTimeout(200);await b.waitForTimeout(200);assert.deepEqual(await a.screenshot(),await b.screenshot());results.push({engine:name,viewport,dpr:3,landscapeByteIdentical:true,passed:true});await context.close();
 }
 await browser.close();
}
await fs.writeFile(new URL(process.env.QA_OUTPUT||'visual-results.json',import.meta.url),JSON.stringify(results,null,2));console.log(`${results.length} visual cases passed; both corners at DPR 1/2/3, 10px plastic sides; normal key sizes preserved; bounded extension and aligned ENTER; actual crossbar/frame tops aligned, landscape identical.`);
