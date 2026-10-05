const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import assert from 'node:assert/strict';import fs from 'node:fs/promises';
const results=[];
for(const [name,engine,options]of [['chromium',chromium,{executablePath:'/usr/bin/chromium',args:['--no-sandbox']}],['webkit',webkit,{}]]){
 const b=await engine.launch({headless:true,...options});const c=await b.newContext({deviceScaleFactor:3,hasTouch:true});const p=await c.newPage();
 await p.addInitScript(()=>{
window.copies=0;window.copyFails=false;window.shareFails=false;
Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>{copies++;return copyFails?Promise.reject(new Error('copy failed')):Promise.resolve()}}});
Object.defineProperty(navigator,'share',{configurable:true,value:()=>shareFails?Promise.reject(new Error('share failed')):Promise.resolve()});
Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});
});
 for(const viewport of [{width:402,height:874},{width:320,height:450},{width:874,height:402},{width:1280,height:720},{width:667,height:375}]){
 await p.setViewportSize(viewport);await p.goto('http://127.0.0.1:5180');await p.evaluate(()=>document.fonts.ready);await p.locator('.lcd').tap();await p.locator('.lcd-copy-success').waitFor();
 const r=await p.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};return {model:rect('.model-name'),brand:rect('.brand'),success:rect('.lcd-copy-success'),lcd:rect('.lcd'),overlay:rect('.lcd-transfer-status'),keys:[...document.querySelectorAll('.key,.brand')].map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}}),status:document.querySelector('[role=status]').getAttribute('aria-live'),notices:document.querySelectorAll('.lcd-transfer-notice').length}});
 if(viewport.width<viewport.height){
 assert.ok(Math.abs(r.success.x+r.success.width/2-(r.model.right+r.brand.x)/2)<.1);assert.ok(Math.abs(r.success.y+r.success.height/2-(Math.min(r.model.y,r.brand.y)+Math.max(r.model.bottom,r.brand.bottom))/2)<.1);
 assert.ok(r.success.x>r.model.right&&r.success.right<r.brand.x);assert.ok(r.success.y>=11&&r.success.bottom<r.lcd.y);
 }else{
 assert.ok(Math.abs(r.overlay.x+r.overlay.width/2-viewport.width/2)<.1);assert.ok(r.overlay.bottom<=viewport.height-8+.1);assert.ok(r.overlay.y>r.lcd.bottom);
 for(const key of r.keys)assert.ok(r.overlay.bottom<=key.top||r.overlay.y>=key.bottom||r.overlay.right<=key.left||r.overlay.x>=key.right);
 }
 assert.equal(r.notices,0);assert.equal(r.status,'polite');
 assert.equal(await p.locator('.lcd-copy-success').evaluate(e=>getComputedStyle(e).pointerEvents),'none');
 await p.screenshot({path:new URL(`${name}-${viewport.width}-success.png`,import.meta.url).pathname});await p.locator('.brand').click();await p.locator('.hp-menu-version').waitFor();await p.keyboard.press('Escape');
 results.push({engine:name,viewport,passed:true,...r});
 }
 await p.setViewportSize({width:402,height:874});await p.locator('.lcd').tap();await p.setViewportSize({width:874,height:402});await p.waitForTimeout(100);
 assert.ok((await p.locator('.lcd-transfer-status').boundingBox()).y>300);await p.setViewportSize({width:402,height:874});await p.waitForTimeout(100);
 assert.ok((await p.locator('.lcd-copy-success').boundingBox()).y<60);results.push({engine:name,test:'live orientation reposition both directions',passed:true});
 await p.locator('.lcd').tap();await p.waitForTimeout(2200);await p.locator('.lcd').tap();await p.waitForTimeout(2200);assert.equal(await p.locator('.lcd-copy-success').isVisible(),true);await p.waitForTimeout(1900);assert.equal(await p.locator('.lcd-copy-success').count(),0);results.push({engine:name,test:'repeat copy renews four-second timeout',passed:true});
 await p.setViewportSize({width:667,height:375});await p.evaluate(()=>shareFails=true);await p.locator('.lcd').focus();await p.keyboard.press('Shift+Enter');await p.waitForTimeout(100);assert.match(await p.locator('.lcd-transfer-status').textContent(),/Não foi possível/);const errorBox=await p.locator('.lcd-transfer-status').boundingBox();assert.ok(errorBox.y>300.125);assert.equal(await p.locator('.lcd-copy-success').count(),0);
 await p.evaluate(()=>copyFails=true);await p.locator('.lcd').tap();await p.locator('dialog').waitFor();assert.equal(await p.locator('.lcd-copy-success').count(),0);assert.match(await p.locator('.lcd-transfer-status').textContent(),/Cópia automática indisponível/);await p.getByRole('button',{name:'Fechar',exact:true}).click();results.push({engine:name,test:'share error retains useful warning without copy confirmation; copy error uses manual dialog without success',passed:true});
  await b.close();
}
await fs.writeFile(new URL('visual-results.json',import.meta.url),JSON.stringify(results,null,2));console.log(JSON.stringify(results.map(r=>({engine:r.engine,viewport:r.viewport,test:r.test,passed:r.passed})),null,2));
