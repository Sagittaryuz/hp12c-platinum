import {createRequire} from 'node:module';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/mrpir/AppData/Local/Temp/hp12c-perf-tools/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});const results=[];
for(const base of process.argv.slice(2)){
 const context=await browser.newContext({viewport:{width:402,height:874}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await context.addInitScript(()=>{if(!localStorage.getItem('hp12c-history-v1'))localStorage.setItem('hp12c-history-v1',JSON.stringify(Array.from({length:100},(_,i)=>({id:'release'+i,time:'2026-10-06T12:00:00Z',operation:'2 + 3',display:'5',value:5,...(i===99?{note:'Nota local preservada'}:{})}))))});
 const response=await page.goto(base);assert.equal(response.status(),200);await page.waitForFunction(()=>document.querySelector('.calculator')?.classList.contains('joined-frame'));await page.evaluate(()=>document.fonts.ready);
 const script=await page.locator('script[type="module"]').getAttribute('src'),bundleUrl=new URL(script,base).href;
 const bundle=await page.request.get(bundleUrl);assert.equal(bundle.status(),200);assert.ok((await bundle.text()).includes('0.2.37'));
 const css=await page.locator('link[rel="stylesheet"]').first().getAttribute('href'),cssResponse=await page.request.get(new URL(css,base).href);assert.equal(cssResponse.status(),200);
 const swUrl=new URL('sw.js',base).href,sw=await page.request.get(swUrl);assert.equal(sw.status(),200);assert.ok((await sw.text()).includes('memory-board-photo.jpeg'));
 const photo=await page.request.get(new URL('assets/memory-board-photo.jpeg',base).href);assert.equal(photo.status(),200);assert.equal((await photo.body()).length,59140);
 const manifest=await page.request.get(new URL('manifest.webmanifest',base).href);assert.equal(manifest.status(),200);
 for(const id of ['2','enter','3','plus'])await page.locator('.key-'+id).click();await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('hp12c-state')).x),5);
 const saved=await page.evaluate(()=>({state:localStorage.getItem('hp12c-state'),history:localStorage.getItem('hp12c-history-v1')}));
 const openMenu=async()=>{await page.locator('.brand').click();await page.waitForTimeout(300);assert.match(await page.locator('.hp-menu-version').innerText(),/v0\.2\.37/)};
 const drag=async(selector,dy)=>{const r=await page.locator(selector).boundingBox(),x=r.x+r.width/2,y=r.y+(selector==='.history-board-heading'?120:20);await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y+dy,{steps:6});await page.mouse.up()};
 await openMenu();await drag('.hp-menu-header',90);await page.locator('.hp-menu').waitFor({state:'detached'});
 await drag('.silver-panel',90);await page.locator('.history-board').waitFor();await page.waitForTimeout(300);assert.equal(await page.locator('.history-board li').count(),100);assert.equal(await page.getByText('Nota local preservada',{exact:true}).count(),1);
 const background=await page.locator('.history-board').evaluate(el=>getComputedStyle(el).backgroundImage);assert.ok(background.includes('rgb(0, 0, 0)'));
 await page.screenshot({path:new URL((new URL(base).hostname)+'-published.png',import.meta.url).pathname.replace(/^\/(\w:)/,'$1')});
 await drag('.history-board-heading',-90);await page.locator('.history-board').waitFor({state:'detached'});assert.deepEqual(await page.evaluate(()=>({state:localStorage.getItem('hp12c-state'),history:localStorage.getItem('hp12c-history-v1')})),saved);
 await page.waitForFunction(async()=>Boolean((await navigator.serviceWorker.getRegistration())?.active));await page.reload();await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
 await context.setOffline(true);await page.reload();await page.locator('.brand').waitFor();await openMenu();await page.keyboard.press('Escape');await page.locator('.hp-menu').waitFor({state:'detached'});assert.deepEqual(await page.evaluate(()=>({state:localStorage.getItem('hp12c-state'),history:localStorage.getItem('hp12c-history-v1')})),saved);
 assert.deepEqual(errors,[]);results.push({url:base,version:'0.2.37',html:response.status(),bundle:bundleUrl,css:cssResponse.status(),sw:sw.status(),swCacheControl:sw.headers()['cache-control'],manifest:manifest.status(),photoBytes:59140,blackMemoryTop:true,menuThenMemoryGesture:true,rows100:true,notesAndFinancialStatePreserved:true,offlineReload:true,errors});await context.close();
}
await browser.close();await fs.writeFile(new URL('release-results.json',import.meta.url),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
