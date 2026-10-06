import {createRequire} from 'node:module';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);const {chromium}=require('C:/Users/mrpir/AppData/Local/Temp/hp12c-perf-tools/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});const page=await browser.newPage({viewport:{width:402,height:874}});
await page.goto('http://127.0.0.1:5198');await page.locator('.brand').click();await page.waitForTimeout(300);
const result=await page.evaluate(async()=>{
 const {animatePanel,panelCoverage,blurForCoverage,setRevealBlur}=await import('/src/panel-motion.mjs');const el=document.querySelector('.hp-menu'),height=el.clientHeight;const samples=[];
 for(const direction of [-1,1])for(const closing of [false,true]){
  const from=closing?0:direction*height,to=closing?direction*height:0;
  const a=animatePanel(el,[{transform:`translate3d(0,${from}px,0)`},{transform:`translate3d(0,${to}px,0)`}],260,{onFrame:p=>{
   setRevealBlur(panelCoverage(from+(to-from)*p,height));
   const actual=new DOMMatrixReadOnly(getComputedStyle(el).transform).m42;
   const expected=blurForCoverage(panelCoverage(actual,height));const filter=document.querySelector('.silver-panel').style.filter;const blur=parseFloat(filter.slice(5))||0;
   samples.push({p,error:Math.abs(expected-blur)});
  }});await a.finished;a.cancel();
 }
 setRevealBlur(0);el.style.transform='';return {samples:samples.length,maxBlurError:Math.max(...samples.map(s=>s.error)),endpointsZero:samples.filter(s=>s.p===0||s.p===1).every(s=>s.error<.001)};
});assert.ok(result.maxBlurError<.01,JSON.stringify(result));assert.ok(result.endpointsZero);
await page.keyboard.press('Escape');await page.locator('.hp-menu').waitFor({state:'detached'});
await browser.close();await fs.writeFile(new URL('geometry.json',import.meta.url),JSON.stringify(result,null,2));console.log(result);
