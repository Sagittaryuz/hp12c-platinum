import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const expected=JSON.parse(await fs.readFile(new URL('./expected.json',import.meta.url),'utf8'));
const browser=await chromium.launch({headless:true}),results=[];
try{
for(const base of ['https://hp12c-platinum-one.vercel.app/','https://sagittaryuz.github.io/hp12c-platinum/']){
 for(const viewport of [{width:320,height:568},{width:393,height:852},{width:852,height:393}]){
  const context=await browser.newContext({viewport,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  const response=await page.goto(base+'?qa=portrait-footer-0.2.55');assert.equal(response.status(),200);
  await page.waitForFunction(()=>document.querySelector('.calculator')?.classList.contains('joined-frame'));await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const asset=await page.locator('script[type="module"]').first().getAttribute('src'),bundleUrl=new URL(asset,base).href,bundle=await page.request.get(bundleUrl);assert.equal(bundle.status(),200);assert.ok((await bundle.text()).includes('0.2.55'),'published bundle version0.2.55');
  const actual=await page.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};const frame=document.querySelector('.portrait-footer-frame'),style=getComputedStyle(frame),inner=getComputedStyle(frame,'::before');return{body:rect('.calculator'),lcd:rect('.lcd'),model:rect('.model-name'),brand:rect('.brand'),maker:rect('.maker-name'),keys:[...document.querySelectorAll('.key')].map(el=>{const r=el.getBoundingClientRect();return{id:el.className,x:r.x,y:r.y,width:r.width,height:r.height}}),frame:rect('.portrait-footer-frame'),frameDisplay:style.display,plastic:style.bottom,metal:inner.bottom,left:style.left,right:style.right,innerLeft:inner.left,innerRight:inner.right,outerRadius:style.borderBottomLeftRadius,innerRadius:inner.borderBottomLeftRadius,overflow:document.documentElement.scrollWidth>innerWidth}});
  assert.deepEqual(actual,expected.find(r=>r.engine==='chromium'&&r.viewport.width===viewport.width).after);
  assert.deepEqual(errors,[]);await page.locator('.key-2').click();await page.locator('.key-enter').click();await page.locator('.key-3').click();await page.locator('.key-plus').click();assert.equal(await page.locator('output.lcd-readable').innerText(),'5,00');
  results.push({url:base,viewport,version:'0.2.55',html:response.status(),bundle:bundleUrl,plastic:actual.plastic,metal:actual.metal,matchedTestedGeometry:true,calculationPassed:true,errors});
  console.log('RELEASE_RESULT:'+JSON.stringify(results.at(-1)));await context.close();
 }
}
}finally{await browser.close()}
