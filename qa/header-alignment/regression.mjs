const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import assert from 'node:assert/strict';import fs from 'node:fs/promises';
const out=new URL('./',import.meta.url);const results=[];
for(const [name,engine,options]of [['chromium',chromium,{executablePath:process.env.CHROMIUM_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']}],['webkit',webkit,{}]]){
 let browser;try{browser=await engine.launch({headless:true,...options})}catch(e){results.push({engine:name,blocked:String(e)});continue}
 const context=await browser.newContext({viewport:{width:402,height:874},deviceScaleFactor:3,hasTouch:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const check=async(label,fn)=>{await fn();results.push({engine:name,test:label,passed:true})};
 try{
 await page.addInitScript(()=>{
 window.transfers=[];window.copyMode='ok';window.shareMode='cancel';
 Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:t=>{window.transfers.push({api:'copy',text:t,active:navigator.userActivation?.isActive});return window.copyMode==='ok'?Promise.resolve():Promise.reject(new DOMException('denied','NotAllowedError'))}}});
 Object.defineProperty(navigator,'share',{configurable:true,value:d=>{window.transfers.push({api:'share',text:d.text,active:navigator.userActivation?.isActive});return window.shareMode==='ok'?Promise.resolve():Promise.reject(new DOMException('cancelled',window.shareMode==='cancel'?'AbortError':'NotAllowedError'))}});
 Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});
 });
 await page.goto('http://127.0.0.1:5180');await page.locator('.lcd canvas').waitFor();await page.evaluate(()=>document.fonts.ready);
 await page.setViewportSize({width:402,height:874});
 await check('trusted tap copies exact display once, no share',async()=>{await page.locator('.lcd').tap();await page.waitForTimeout(50);const calls=await page.evaluate(()=>transfers);assert.equal(calls.length,1);assert.equal(calls[0].text,await page.locator('.lcd-readable').first().textContent());assert.equal(calls[0].api,'copy')});
 const gesture=async(kind)=>{await page.evaluate(()=>transfers.length=0);await page.locator('.lcd').evaluate(async(el,kind)=>{
 const r=el.getBoundingClientRect(),p={bubbles:true,pointerId:77,pointerType:'touch',isPrimary:true,button:0,clientX:r.x+20,clientY:r.y+20};
 el.dispatchEvent(new PointerEvent('pointerdown',p));await new Promise(r=>setTimeout(r,550));
 if(kind==='drag')window.dispatchEvent(new PointerEvent('pointermove',{...p,clientX:p.clientX+30}));
 if(kind==='cancel')window.dispatchEvent(new PointerEvent('pointercancel',p));
 if(kind==='multi')window.dispatchEvent(new PointerEvent('pointerdown',{...p,pointerId:78,isPrimary:false}));
 if(kind==='blur')window.dispatchEvent(new Event('blur'));
 window.dispatchEvent(new PointerEvent('pointerup',p));el.dispatchEvent(new MouseEvent('click',{bubbles:true,detail:1}));
 },kind);await page.waitForTimeout(50)};
 await check('hold copy/share initiated once; cancellation is not error',async()=>{await gesture('hold');assert.deepEqual((await page.evaluate(()=>transfers)).map(x=>x.api),['copy','share']);assert.equal(await page.locator('.lcd-transfer-status').textContent(),'')});
 await check('tap then cancelled share clears previous copy status, repeated holds remain silent',async()=>{
 await page.locator('.lcd').tap();assert.equal(await page.locator('.lcd-copy-success').textContent(),'Valor copiado.');
 await gesture('hold');assert.equal(await page.locator('.lcd-copy-success').count(),0);assert.equal(await page.locator('.lcd-transfer-status').textContent(),'');
 await gesture('hold');assert.deepEqual((await page.evaluate(()=>transfers)).map(x=>x.api),['copy','share']);assert.equal(await page.locator('.lcd-transfer-status').textContent(),'');
 });
 await check('successful share is silent; next tap restores confirmation and expiry',async()=>{
 await page.evaluate(()=>shareMode='ok');await gesture('hold');assert.equal(await page.locator('.lcd-transfer-status').textContent(),'');
 await page.locator('.lcd').tap();await page.waitForTimeout(50);assert.equal(await page.locator('.lcd-copy-success').textContent(),'Valor copiado.');
 await page.waitForTimeout(4100);assert.equal(await page.locator('.lcd-copy-success').count(),0);await page.evaluate(()=>shareMode='cancel');
 });
 await check('hold clears old message while share pending, delayed success stays silent',async()=>{
 await page.locator('.lcd').tap();await page.waitForTimeout(50);
 await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:d=>{transfers.push({api:'share',text:d.text,feedbackAtCall:document.querySelector('.lcd-copy-success')?.textContent||''});return new Promise(resolve=>window.finishShare=resolve)}}));
 await gesture('hold');assert.equal((await page.evaluate(()=>transfers)).find(x=>x.api==='share').feedbackAtCall,'');assert.equal(await page.locator('.lcd-transfer-status').textContent(),'');
 await page.evaluate(()=>finishShare());await page.waitForTimeout(50);assert.equal(await page.locator('.lcd-transfer-status').textContent(),'');
 await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:d=>{transfers.push({api:'share',text:d.text});return Promise.reject(new DOMException('cancelled','AbortError'))}}));
 });
  for(const kind of ['drag','cancel','multi','blur'])await check('cancel '+kind,async()=>{await gesture(kind);assert.equal((await page.evaluate(()=>transfers)).length,0)});
 await check('keyboard copy and share do not calculate',async()=>{const before=await page.evaluate(()=>localStorage.getItem('hp12c-state'));await page.evaluate(()=>transfers.length=0);await page.locator('.lcd').focus();await page.keyboard.press('Enter');await page.waitForTimeout(30);await page.keyboard.press('Shift+Enter');await page.waitForTimeout(30);assert.deepEqual((await page.evaluate(()=>transfers)).map(x=>x.api),['copy','copy','share']);assert.equal(await page.evaluate(()=>localStorage.getItem('hp12c-state')),before)});
 await check('copy failure opens selectable fallback; focus restored',async()=>{await page.evaluate(()=>copyMode='fail');await page.locator('.lcd').tap();await page.locator('dialog').waitFor();const value=await page.locator('dialog textarea').inputValue();assert.equal(value,await page.locator('.lcd-readable').first().textContent());await page.getByRole('button',{name:'Fechar',exact:true}).click();assert.equal(await page.locator('.lcd').evaluate(e=>e===document.activeElement),true);await page.evaluate(()=>copyMode='ok')});
 await check('share absent still copies and reports unavailable',async()=>{await page.evaluate(()=>Object.defineProperty(navigator,'share',{value:undefined,configurable:true}));await gesture('hold');assert.deepEqual((await page.evaluate(()=>transfers)).map(x=>x.api),['copy']);assert.match(await page.locator('.lcd-transfer-status').textContent(),/Compartilhamento indisponível/)});
 await check('menu disables visor interaction',async()=>{await page.locator('.brand').click();assert.equal(await page.locator('.lcd').getAttribute('aria-disabled'),'true');const before=(await page.evaluate(()=>transfers)).length;await page.locator('.lcd').dispatchEvent('click',{detail:0});assert.equal((await page.evaluate(()=>transfers)).length,before);await page.keyboard.press('Escape')});
 await check('2 ENTER 3 + =5; state survives reload',async()=>{await page.locator('.key-2').tap();await page.locator('.key-enter').tap();await page.locator('.key-3').tap();await page.locator('.key-plus').tap();assert.match(await page.locator('.lcd-readable').first().textContent(),/^5,/);await page.waitForFunction(()=>JSON.parse(localStorage.getItem('hp12c-state')).x===5);const s=await page.evaluate(()=>localStorage.getItem('hp12c-state'));await page.reload();await page.locator('.lcd').waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('hp12c-state')),s)});
 assert.deepEqual(errors,[]);results.push({engine:name,test:'no JS errors',passed:true});
 }catch(e){results.push({engine:name,failed:String(e),stack:e.stack})}finally{await browser.close()}
}
await fs.writeFile(new URL('interaction-results.json',out),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));if(results.some(r=>r.failed))process.exitCode=1;
