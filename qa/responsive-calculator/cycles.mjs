import {createRequire} from 'node:module';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/mrpir/AppData/Local/Temp/hp12c-perf-tools/node_modules/playwright');const results=[];
for(const engine of ['chromium','webkit']){
 const browser=await (engine==='webkit'?webkit:chromium).launch(engine==='webkit'?{headless:true}:{headless:true,executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 for(const viewport of [{width:402,height:874},{width:1280,height:800}])for(const reducedMotion of ['no-preference','reduce'])for(const input of engine==='chromium'?['mouse','touch']:['mouse']){
  const page=await browser.newPage({viewport,hasTouch:input==='touch',reducedMotion});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(()=>localStorage.setItem('hp12c-history-v1',JSON.stringify(Array.from({length:100},(_,i)=>({id:'cycle'+i,time:new Date().toISOString(),operation:'2 + 3',display:'5',value:5})))));
  await page.goto('http://127.0.0.1:5199');await page.waitForFunction(()=>document.querySelector('.calculator')?.classList.contains('joined-frame'));await page.evaluate(()=>document.fonts.ready);
  await page.waitForFunction(()=>localStorage.getItem('hp12c-state'));const initial=await page.evaluate(()=>localStorage.getItem('hp12c-state'));const cdp=input==='touch'?await page.context().newCDPSession(page):null;
  const drag=async(selector,dy,cancel=false,reverse=false)=>{
   const r=await page.locator(selector).boundingBox(),x=r.x+r.width/2,y=selector==='.history-board-heading'?r.y+20:selector==='.hp-menu-header'?r.y+70:r.y+Math.min(20,r.height/2);
   if(cdp){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});for(let i=1;i<=6;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+dy*i/6,id:1}]});await page.waitForTimeout(16)}if(reverse)for(let i=5;i>=0;i--){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+dy*i/6,id:1}]});await page.waitForTimeout(16)}await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]})}
   else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y+dy,{steps:6});if(reverse)await page.mouse.move(x,y,{steps:6});if(cancel)await page.evaluate(()=>window.dispatchEvent(new PointerEvent('pointercancel',{pointerId:1,bubbles:true})));await page.mouse.up()}
  };
  for(const surface of ['.silver-panel','.key-7','.lcd']){
   await drag(surface,90);await page.locator('.history-board').waitFor();await page.waitForTimeout(300);assert.equal(await page.locator('.history-board .history-calculation-row').count(),100);
   await drag('.history-board-heading',-10);await page.waitForTimeout(190);assert.equal(await page.locator('.history-board').count(),1);
   await drag('.history-board-heading',-55,false,true);await page.waitForTimeout(190);assert.equal(await page.locator('.history-board').count(),1);
   await drag('.history-board-heading',-50,true);await page.waitForTimeout(190);assert.equal(await page.locator('.history-board').count(),1);
   await drag('.history-board-heading',-90);await page.locator('.history-board').waitFor({state:'detached'});
   await page.locator('.brand').click();await page.waitForTimeout(300);await drag('.hp-menu-header',10);await page.waitForTimeout(190);assert.equal(await page.locator('.hp-menu').count(),1);
   await drag('.hp-menu-header',55,false,true);await page.waitForTimeout(190);assert.equal(await page.locator('.hp-menu').count(),1);
   await drag('.hp-menu-header',50,true);await page.waitForTimeout(190);assert.equal(await page.locator('.hp-menu').count(),1);
   await drag('.hp-menu-header',90);await page.locator('.hp-menu').waitFor({state:'detached'});
  }
  assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>localStorage.getItem('hp12c-state')),initial);
  results.push({engine,viewport,input,reducedMotion,cycles:3,surfaces:['plate','key','lcd'],bothDirections:true,shortReverseCancel:true,rows100:true,financialStatePreserved:true,errors});await page.close();
 }
 await browser.close();
}
await fs.writeFile(new URL('cycles.json',import.meta.url),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
