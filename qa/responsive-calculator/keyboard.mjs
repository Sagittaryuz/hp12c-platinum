import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium,webkit}=require('C:/Users/mrpir/AppData/Local/Temp/hp12c-perf-tools/node_modules/playwright');
for(const engine of ['chromium','webkit']){
 const browser=await(engine==='webkit'?webkit:chromium).launch(engine==='webkit'?{headless:true}:{headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 for(const viewport of [{width:1280,height:800},{width:402,height:874},{width:768,height:1024}]){
 const page=await browser.newPage({viewport});await page.goto(process.argv[2]||'http://127.0.0.1:4174');await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(500);
 const value=()=>page.locator('output.lcd-readable').innerText();
 await page.locator('.key-2').click();await page.keyboard.press('Enter');await page.keyboard.type('3');await page.keyboard.press('+');assert.equal(await value(),'5,00');
 await page.keyboard.press('Escape');assert.equal(await value(),'0,00');await page.keyboard.type('1234');await page.keyboard.press('Backspace');assert.equal(await value(),'123');await page.keyboard.press('Backspace');assert.equal(await value(),'12');
 await page.keyboard.press('Enter');await page.keyboard.type('5');await page.keyboard.press('+');assert.equal(await value(),'17,00');await page.keyboard.press('Backspace');assert.equal(await value(),'1');
 await page.keyboard.press('Escape');await page.locator('.key-f').click();await page.locator('.key-eex').click();assert.equal(await page.locator('.enter-letters').innerText(),'=');await page.keyboard.type('2+3');await page.keyboard.press('Enter');assert.equal(await value(),'5,00');
 await page.keyboard.press('Escape');assert.equal(await value(),'0,00');await page.locator('.key-f').click();await page.locator('.key-chs').click();assert.equal((await page.locator('.enter-letters').innerText()).replace(/\s/g,''),'ENTER');
 const g=await page.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return{top:r.top,bottom:r.bottom,width:r.width,height:r.height}},c=rect('.calculator'),text=rect('.maker-lettering'),f=document.querySelector('.portrait-footer-frame');return{c,text,rail:getComputedStyle(f,'::before').bottom,landscapeRail:rect('.keyboard-frame'),panel:rect('.keyboard-panel')}});assert.equal(g.c.height,viewport.height);assert.equal(g.c.width,viewport.width);assert.ok(g.text.bottom<=viewport.height);if(viewport.width<viewport.height)assert.equal(g.rail,'2px');else{assert.equal(viewport.height-g.landscapeRail.bottom,2);assert.equal(viewport.height-g.panel.bottom,4);}console.log(engine,viewport,'keyboard/fullscreen/rail passed');await page.close();
 }await browser.close();
}
