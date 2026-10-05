import {chromium,webkit} from '/tmp/hp12c-browser-tools/node_modules/playwright/index.mjs';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
const results=[];
for(const [name,engine,opts]of [['chromium',chromium,{executablePath:'/usr/bin/chromium',args:['--no-sandbox','--ignore-certificate-errors']}],['webkit',webkit,{}]]){
 const b=await engine.launch({headless:true,...opts});
 for(const url of ['http://127.0.0.1:5198/']){
 const c=await b.newContext({hasTouch:true,ignoreHTTPSErrors:true,viewport:{width:402,height:874}});const p=await c.newPage();p.setDefaultNavigationTimeout(15000);await p.goto(url,{waitUntil:'domcontentloaded'});
 await p.locator('.brand').click();assert.match(await p.locator('.hp-menu-version').textContent(),/0\.2\.25/);await p.keyboard.press('Escape');
 await p.evaluate(()=>{
 window.calls=[];const realCopy=navigator.clipboard.writeText.bind(navigator.clipboard);
 Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:text=>{calls.push({api:'copy',active:navigator.userActivation?.isActive});return realCopy(text)}}});
 Object.defineProperty(navigator,'share',{configurable:true,value:()=>{calls.push({api:'share',active:navigator.userActivation?.isActive,feedbackAtCall:document.querySelector('.lcd-copy-success')?.textContent||''});return Promise.reject(new DOMException('cancelled','AbortError'))}});Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});
 });
 await p.locator('.lcd').tap();await p.locator('.lcd-copy-success').waitFor();await p.evaluate(()=>calls.length=0);
 if(name==='chromium'){
 const session=await c.newCDPSession(p),r=await p.locator('.lcd').boundingBox();await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+20,y:r.y+20,id:1}]});await p.waitForTimeout(650);await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 }else await p.locator('.lcd').evaluate(async el=>{const r=el.getBoundingClientRect(),o={bubbles:true,pointerId:73,pointerType:'touch',isPrimary:true,button:0,clientX:r.x+20,clientY:r.y+20};el.dispatchEvent(new PointerEvent('pointerdown',o));await new Promise(r=>setTimeout(r,550));window.dispatchEvent(new PointerEvent('pointerup',o));el.dispatchEvent(new MouseEvent('click',{bubbles:true,detail:1}))});
 await p.waitForTimeout(150);const calls=await p.evaluate(()=>calls);assert.deepEqual(calls.map(x=>x.api),['copy','share']);assert.equal(calls[1].feedbackAtCall,'');assert.equal(await p.locator('.lcd-copy-success').count(),0);
 if(name==='chromium'){assert.equal(await p.locator('.lcd-transfer-status').textContent(),'');assert.ok(calls.every(x=>x.active));}
 // Untrusted WebKit pointer simulation may reject real clipboard writes; native activation is not simulated.
 if(await p.locator('dialog').count())await p.getByRole('button',{name:'Fechar',exact:true}).click();
 await p.locator('.lcd').tap();await p.locator('.lcd-copy-success').waitFor();results.push({engine:name,url,passed:true,realTapCopy:true,holdCopyAndMockShareOnce:true,previousToastClearedBeforeShare:true,newTapRestoresFeedback:true,trustedHold:name==='chromium',calls});await c.close();
 }await b.close();
}
await fs.writeFile(new URL('feedback-results.json',import.meta.url),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
