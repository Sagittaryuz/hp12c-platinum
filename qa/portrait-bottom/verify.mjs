import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const output=new URL('./output/',import.meta.url);await fs.mkdir(output,{recursive:true});
const results=[];let failure=false;
for(const [name,engine]of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
 for(const viewport of [{width:320,height:568},{width:393,height:852},{width:852,height:393}]){
  const context=await browser.newContext({viewport,serviceWorkers:'block'});
  const page=await context.newPage(),baseline=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await Promise.all([page.goto('http://127.0.0.1:4173'),baseline.goto('http://127.0.0.1:4174')]);
  for(const p of [page,baseline]){await p.waitForFunction(()=>document.querySelector('.calculator')?.classList.contains('joined-frame'));await p.evaluate(()=>document.fonts.ready);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))}
  const measure=p=>p.evaluate(()=>{
   const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};
   const frame=document.querySelector('.portrait-footer-frame'),style=getComputedStyle(frame),inner=getComputedStyle(frame,'::before');
   return{body:rect('.calculator'),lcd:rect('.lcd'),model:rect('.model-name'),brand:rect('.brand'),maker:rect('.maker-name'),keys:[...document.querySelectorAll('.key')].map(el=>{const r=el.getBoundingClientRect();return{id:el.className,x:r.x,y:r.y,width:r.width,height:r.height}}),frame:rect('.portrait-footer-frame'),frameDisplay:style.display,plastic:style.bottom,metal:inner.bottom,left:style.left,right:style.right,innerLeft:inner.left,innerRight:inner.right,outerRadius:style.borderBottomLeftRadius,innerRadius:inner.borderBottomLeftRadius,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  const before=await measure(baseline),after=await measure(page),checks=[];
  const check=(label,fn)=>{try{fn();checks.push({label,passed:true})}catch(e){failure=true;checks.push({label,passed:false,error:e.message})}};
  check('viewport/no overflow',()=>{assert.equal(after.body.width,viewport.width);assert.equal(after.body.height,viewport.height);assert.equal(after.overflow,false)});
  for(const key of ['lcd','model','brand','maker'])check('preserve '+key,()=>assert.deepEqual(after[key],before[key]));
  check('preserve key sizes and horizontal positions',()=>{assert.equal(after.keys.length,before.keys.length);after.keys.forEach((k,i)=>{const old=before.keys[i];assert.equal(k.id,old.id);assert.equal(k.x,old.x);assert.equal(k.width,old.width);if(!k.id.includes('key-enter'))assert.equal(k.height,old.height)})});
  if(viewport.width<viewport.height){
   check('first row anchored; bounded lower clearance',()=>{const a=after.keys.find(k=>k.id.includes('key-sin')),b=before.keys.find(k=>k.id.includes('key-sin'));assert.equal(a.y,b.y);after.keys.filter(k=>k.height>0).forEach((k,i)=>{const old=before.keys.find(v=>v.id===k.id);assert.ok(k.y<=old.y+0.05);assert.ok(k.y>=old.y-8.1)})});
   check('uniform row spacing and aligned ENTER',()=>{const ids=['key-sin','key-cos','key-tan','key-rcl','key-sto','key-g','key-f'];const rows=ids.map(id=>after.keys.find(k=>k.id.split(' ').includes(id)));const pitch=rows[1].y-rows[0].y;for(let i=2;i<rows.length;i++)assert.ok(Math.abs(rows[i].y-rows[i-1].y-pitch)<0.04);const enter=after.keys.find(k=>k.id.split(' ').includes('key-enter'));assert.equal(enter.y,rows[5].y);assert.ok(Math.abs(enter.y+enter.height-rows[6].y-rows[6].height)<0.04)});
  }else check('landscape keys identical',()=>assert.deepEqual(after.keys,before.keys));
  for(const key of ['left','right','innerLeft','innerRight','outerRadius','innerRadius'])check('preserve '+key,()=>assert.equal(after[key],before[key]));
  if(viewport.width<viewport.height){check('lower crosspiece total20px',()=>{assert.equal(after.plastic,'10px');assert.equal(after.metal,'10px');assert.equal(parseFloat(after.plastic)+parseFloat(after.metal),20)})}
  else{const a=await page.screenshot(),b=await baseline.screenshot();check('landscape pixels identical',()=>assert.deepEqual(a,b))}
  const portrait=viewport.width<viewport.height;
  const screenshot=await page.screenshot({path:new URL(name+'-'+viewport.width+'-after.png',output).pathname});
  await baseline.screenshot({path:new URL(name+'-'+viewport.width+'-before.png',output).pathname});
  if(name==='chromium'&&portrait)console.log('QA_IMAGE:'+viewport.width+':'+screenshot.toString('base64'));
  await page.locator('.key-2').click();await page.locator('.key-enter').click();await page.locator('.key-3').click();await page.locator('.key-plus').click();
  const value=await page.locator('output.lcd-readable').innerText();check('RPN2+3',()=>assert.equal(value,'5,00'));
  check('no runtime errors',()=>assert.deepEqual(errors,[]));
  results.push({engine:name,viewport,before,after,checks});console.log('QA_RESULT:'+JSON.stringify(results.at(-1)));
  await context.close();
 }
 }finally{await browser.close()}
}
await fs.writeFile(new URL('results.json',output),JSON.stringify(results,null,2));
if(failure)throw new Error('Rendered regression checks failed; inspect QA_RESULT.');
