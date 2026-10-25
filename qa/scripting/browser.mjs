// Run with the available Playwright module; no browser/dependency installation.
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createNativeStore} from '../../scripting/host-state.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.HP12C_PLAYWRIGHT||'playwright');
const output=process.env.HP12C_QA_OUTPUT_DIR||'/tmp/hp12c-scripting-qa';await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.HP12C_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
const results=[],errors=[],requests=[];
const data=new Map();let savingFails=false,hapticFails=false,haptics=0,exported=null,imported=null;
const store=createNativeStore({get:key=>data.get(key)??null,set:(key,value)=>{if(savingFails)return false;data.set(key,structuredClone(value));return true}});
async function open(variant='scripting',viewport={width:393,height:852},safe=false){
 const context=await browser.newContext({viewport,hasTouch:true,isMobile:true,deviceScaleFactor:1,serviceWorkers:'block'});
 await context.exposeFunction('__native',async(name,params)=>{switch(name){case'hpRead':return store.read();case'hpSave':return store.save(params);case'hpHaptic':haptics++;if(hapticFails)throw new Error('Haptic unavailable');return true;case'hpExport':exported=params;return true;case'hpImport':return imported}});
 await context.addInitScript(()=>{window.webkit={messageHandlers:Object.fromEntries(['hpRead','hpSave','hpHaptic','hpExport','hpImport'].map(name=>[name,{postMessage:params=>window.__native(name,params)}]))}});
 const root=variant==='scripting'?path.resolve('dist/scripting/HP12C Platinum/web'):variant==='before'?'/tmp/hp12c-baseline/dist/client':path.resolve('dist/client');
 await context.route('**/*',async route=>{const url=new URL(route.request().url());requests.push(url.href);if(url.hostname!=='hp12c.local')throw new Error('Unexpected external request '+url);const target=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));assert(target.startsWith(root+'/'));try{await route.fulfill({path:target})}catch(error){errors.push('Resource '+target+': '+error);await route.abort()}});
 await context.setOffline(true);const page=await context.newPage();page.setDefaultTimeout(7000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://hp12c.local/');await page.waitForSelector('.joined-frame');await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(150);
 if(safe){await page.addStyleTag({content:'*{--safe-top:62px;--safe-bottom:34px}'});await page.evaluate(()=>{for(const sheet of document.styleSheets){try{for(const rule of sheet.cssRules){if(rule.style)for(const property of rule.style){const value=rule.style.getPropertyValue(property);if(value.includes('env(safe-area-inset-'))rule.style.setProperty(property,value.replaceAll(/env\(safe-area-inset-top(?:,\s*[^)]+)?\)/g,'62px').replaceAll(/env\(safe-area-inset-bottom(?:,\s*[^)]+)?\)/g,'34px').replaceAll(/env\(safe-area-inset-(left|right)(?:,\s*[^)]+)?\)/g,'0px'))}}}catch{}}window.dispatchEvent(new Event('resize'))});await page.waitForTimeout(150)}
 return {page,context};
}
async function check(name,fn){try{await fn();results.push({name,pass:true})}catch(error){results.push({name,pass:false,error:error.stack});console.error(name,error)}}
const state=()=>JSON.parse(store.read().entries['hp12c-state']);
const flush=page=>page.evaluate(()=>window.hp12cFlush());
await check('offline startup, touch/RPN, one native haptic per valid activation and no SW/WASM fetch',async()=>{
 const {page,context}=await open();assert.equal(await page.title(),'HP 12c Platinum');assert(await page.locator('.key').count()>35);assert.equal(await page.locator('vite-error-overlay').count(),0);const count=haptics;
 for(const key of ['2','enter','3','plus'])await page.locator('.key-'+key).tap();await flush(page);assert.equal(state().x,5);assert.equal(haptics-count,4);assert.equal(await page.locator('html').getAttribute('data-calculator-engine'),'javascript');assert(!requests.some(url=>/\.wasm|sw\.js/.test(url)));await context.close();
});
await check('close/reopen without browser storage and keyboard repeat suppression',async()=>{
 const {page,context}=await open();assert.equal(state().x,5);assert.equal(await page.evaluate(()=>localStorage.length),0);const count=haptics;await page.keyboard.press('Escape');await page.keyboard.down('4');await page.keyboard.down('4');await page.keyboard.up('4');await page.keyboard.press('2');await flush(page);assert.equal(state().x,42);assert.equal(haptics-count,3);await context.close();
});
await check('native backup export, invalid/cancelled restore, valid atomic restore and vibration preference reopening',async()=>{
 const {page,context}=await open('scripting',{width:852,height:393});await page.locator('.key-menu').tap();await page.getByRole('button',{name:'Configurações',exact:true}).click();const vibration=page.getByRole('switch',{name:'Vibração das teclas'});assert.equal(await vibration.isChecked(),true);await vibration.click();await flush(page);
 await page.getByRole('button',{name:'Salvar backup',exact:true}).click();await page.waitForFunction(()=>document.body.innerText.includes('Backup salvo em Arquivos.'));assert(exported.includes('hp12c-platinum-backup'));const before=structuredClone(store.read());
 imported='not json';await page.getByRole('button',{name:'Restaurar backup',exact:true}).click();await page.waitForFunction(()=>document.body.innerText.includes('Não foi possível restaurar'));assert.deepEqual(store.read(),before);
 imported=null;await page.getByRole('button',{name:'Restaurar backup',exact:true}).click();await page.waitForTimeout(50);assert.deepEqual(store.read(),before);
 const backup=JSON.parse(exported);const next=JSON.parse(backup.entries['hp12c-state']);next.x=123;next.input='123';backup.entries['hp12c-state']=JSON.stringify(next);imported=JSON.stringify(backup);
 await page.getByRole('button',{name:'Restaurar backup',exact:true}).click();await page.waitForFunction(()=>document.body.innerText.includes('Backup restaurado'));await flush(page);assert.equal(state().x,123);await context.close();
 const second=await open('scripting',{width:852,height:393});const count=haptics;await second.page.locator('.key-2').tap();await flush(second.page);assert.equal(haptics,count);await second.page.locator('.key-menu').tap();await second.page.getByRole('button',{name:'Configurações',exact:true}).click();assert.equal(await second.page.getByRole('switch',{name:'Vibração das teclas'}).isChecked(),false);await second.context.close();
});
await check('failed native save is visible, preserves durable state, export remains available, retry succeeds',async()=>{
 const {page,context}=await open('scripting',{width:852,height:393});const old=structuredClone(store.read());savingFails=true;await page.locator('.key-7').tap();await page.waitForFunction(()=>document.body.innerText.includes('Não foi possível salvar no Scripting'));assert.deepEqual(store.read(),old);await page.locator('.notice').click();await page.locator('.key-menu').tap();await page.getByRole('button',{name:'Configurações',exact:true}).click();await page.getByRole('button',{name:'Salvar backup',exact:true}).click();await page.waitForFunction(()=>document.body.innerText.includes('Backup salvo em Arquivos.'));assert.notEqual(JSON.parse(JSON.parse(exported).entries['hp12c-state']).x,JSON.parse(old.entries['hp12c-state']).x);savingFails=false;await flush(page);assert.notEqual(state().x,JSON.parse(old.entries['hp12c-state']).x);await context.close();
});
await check('native haptic failure never blocks calculation',async()=>{data.clear();const {page,context}=await open();hapticFails=true;await page.keyboard.press('Escape');await page.locator('.key-6').tap();await flush(page);assert.equal(state().x,6);hapticFails=false;await context.close()});
// Compare fresh calculator states; preferences do not paint the calculator face.
data.clear();
for(const viewport of [{width:320,height:568},{width:393,height:852},{width:402,height:874},{width:852,height:393},{width:1280,height:800}])await check(`visual equivalence and bounds ${viewport.width}x${viewport.height}`,async()=>{
 const a=await open('before',viewport),b=await open('scripting',viewport);
 const bounds=page=>page.locator('.key').evaluateAll(keys=>keys.map(key=>{const r=key.getBoundingClientRect();return {id:key.className,x:r.x,y:r.y,width:r.width,height:r.height}}));
 assert.deepEqual(await bounds(a.page),await bounds(b.page));assert.deepEqual(await b.page.locator('.key').evaluateAll(keys=>keys.filter(key=>{const r=key.getBoundingClientRect();return r.left<0||r.top<0||r.right>innerWidth+1||r.bottom>innerHeight+1}).map(key=>key.className)),[]);
 await a.page.screenshot({path:path.join(output,`web-${viewport.width}x${viewport.height}.png`)});await b.page.screenshot({path:path.join(output,`scripting-${viewport.width}x${viewport.height}.png`)});
 await a.context.close();await b.context.close();
});
await check('safe areas, rotation, LCD drag cancellation and rapid keyboard',async()=>{
 const {page,context}=await open('scripting',{width:393,height:852},true);
 await page.screenshot({path:path.join(output,'scripting-safe-areas.png')});
 const start=state().x;const r=await page.locator('.lcd').boundingBox();const session=await context.newCDPSession(page);const x=r.x+r.width/2,y=r.y+r.height/2;await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+60}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForSelector('.history-board');await flush(page);assert.equal(state().x,start);await page.locator('.history-board-close').tap();await page.waitForSelector('.history-board',{state:'detached'});
 await page.setViewportSize({width:852,height:393});await page.waitForTimeout(150);await page.setViewportSize({width:393,height:852});await page.waitForTimeout(150);await page.keyboard.press('Escape');await page.keyboard.type('1234567890',{delay:0});await flush(page);assert.equal(state().x,1234567890);await context.close();
});
await browser.close();
await fs.writeFile(path.join(output,'results.json'),JSON.stringify({environment:'Chromium, offline context, local route fulfillment, native API simulation; file:// denied by administrator policy',results,errors,requests},null,2));console.log(JSON.stringify({results,errors},null,2));if(results.some(r=>!r.pass)||errors.length)process.exitCode=1;
