import {createRequire} from 'node:module';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/mrpir/AppData/Local/Temp/hp12c-perf-tools/node_modules/playwright');const results=[],base=process.argv[2]||'http://127.0.0.1:4174';
for(const engine of ['chromium','webkit']){
 const browser=await(engine==='webkit'?webkit:chromium).launch(engine==='webkit'?{headless:true}:{headless:true,executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 for(const viewport of [{width:402,height:874},{width:1280,height:800}])for(const reducedMotion of ['no-preference','reduce'])for(const input of engine==='chromium'?['mouse','touch']:['mouse']){
  const page=await browser.newPage({viewport,hasTouch:input==='touch',reducedMotion}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(()=>{const items=Array.from({length:100},(_,i)=>({id:'cycle'+i,time:new Date().toISOString(),operation:'2 + 3',display:'5',value:5}));localStorage.setItem('hp12c-history-v1',JSON.stringify(items))});
  await page.goto(base);await page.waitForFunction(()=>document.querySelector('.calculator')?.classList.contains('joined-frame'));await page.evaluate(()=>document.fonts.ready);await page.waitForFunction(()=>localStorage.getItem('hp12c-state'));
  const initial=await page.evaluate(()=>localStorage.getItem('hp12c-state')),cdp=input==='touch'?await page.context().newCDPSession(page):null;
  const drag=async(selector,dy)=>{const r=await page.locator(selector).boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2;if(cdp){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});for(let i=1;i<=6;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+dy*i/6,id:1}]});await page.waitForTimeout(16)}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y+dy,{steps:6});await page.mouse.up()}};
  for(const surface of ['.silver-panel','.key-7','.lcd']){await drag(surface,90);await page.waitForTimeout(220);assert.equal(await page.locator('.history-board').count(),0,`pull on ${surface} must not open memory`);assert.equal(await page.locator('.hp-menu').count(),0);assert.equal(await page.evaluate(()=>localStorage.getItem('hp12c-state')),initial)}
  await page.locator('.brand').click();await page.locator('.history-board').waitFor();assert.equal(await page.locator('.history-board .history-calculation-row').count(),100);assert.equal(await page.getByRole('button',{name:'Fechar memória',exact:true}).count(),1);
  await drag('.history-board-heading',-90);await page.waitForTimeout(220);assert.equal(await page.locator('.history-board').count(),1,'pulling the memory header must not close the panel');
  await page.getByRole('button',{name:'Fechar memória',exact:true}).click();await page.locator('.history-board').waitFor({state:'detached'});
  await page.locator('.brand').click();await page.locator('.history-board').waitFor();await page.getByRole('button',{name:'Fechar memória',exact:true}).click();await page.locator('.history-board').waitFor({state:'detached'});
  assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>localStorage.getItem('hp12c-state')),initial);assert.equal(await page.getByRole('button',{name:'Abrir menu da calculadora',exact:true}).count(),0);
  results.push({engine,viewport,input,reducedMotion,calculatorPullDisabled:true,hpButtonOpensMemory:true,memoryPullDoesNotClose:true,topXClosesMemory:true,memorySettingsButtonRemoved:true,financialStatePreserved:true,errors});await page.close();
 }
 await browser.close();
}
await fs.writeFile(process.env.QA_OUTPUT||new URL('cycles.json',import.meta.url),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
