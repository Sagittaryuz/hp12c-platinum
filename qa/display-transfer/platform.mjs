const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import http from 'node:http';import path from 'node:path';
const results=[];let offline=false;const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.webmanifest':'application/manifest+json'};
const server=http.createServer(async(req,res)=>{if(offline){req.socket.destroy();return}try{const file=path.join(process.cwd(),'dist/client',new URL(req.url,'http://localhost').pathname.replace(/^\//,'')||'index.html');res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file))}catch{res.writeHead(404);res.end()}});await new Promise(r=>server.listen(5177,'127.0.0.1',r));
for(const [name,engine,opts]of [['chromium',chromium,{executablePath:process.env.CHROMIUM_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']}],['webkit',webkit,{}]]){
 const browser=await engine.launch({headless:true,...opts}),context=await browser.newContext({viewport:{width:402,height:874},hasTouch:true});const p=await context.newPage();
 try{
 offline=false;await p.goto('http://localhost:5177');await p.locator('.lcd').waitFor();await p.locator('.lcd').tap();await p.waitForTimeout(100);const msg=await p.locator('.lcd-transfer-status').textContent();results.push({engine:name,test:'real clipboard write from trusted tap (no read)',message:msg,copied:msg==='Valor copiado.'});
 if(await p.locator('dialog').count())await p.getByRole('button',{name:'Fechar',exact:true}).click();
 if(name==='chromium'){
 await p.evaluate(()=>{window.calls=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:t=>{calls.push({api:'copy',text:t,active:navigator.userActivation.isActive});return Promise.resolve()}}});Object.defineProperty(navigator,'share',{configurable:true,value:d=>{calls.push({api:'share',text:d.text,active:navigator.userActivation.isActive});return Promise.reject(new DOMException('cancel','AbortError'))}});Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true})});
 const session=await context.newCDPSession(p),r=await p.locator('.lcd').boundingBox(),point={x:r.x+20,y:r.y+20,id:1};
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await p.waitForTimeout(650);await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(100);const calls=await p.evaluate(()=>window.calls);assert.deepEqual(calls.map(x=>x.api),['copy','share']);assert(calls.every(x=>x.active));results.push({engine:name,test:'trusted CDP touch hold: activation active, exactly one copy/share',passed:true});
 }
 await p.locator('.key-2').tap();await p.locator('.key-enter').tap();await p.locator('.key-3').tap();await p.locator('.key-plus').tap();await p.waitForFunction(()=>JSON.parse(localStorage.getItem('hp12c-state')).x===5);
 await p.evaluate(async()=>{await navigator.serviceWorker.ready});await p.reload();await p.waitForFunction(()=>navigator.serviceWorker.controller);const before=await p.evaluate(()=>localStorage.getItem('hp12c-state'));
 // Chromium offline is native automation; WebKit local server requests are blocked to simulate it.
 if(name==='chromium')await context.setOffline(true);else offline=true;
 await p.reload();await p.locator('.lcd').waitFor();assert.equal(await p.evaluate(()=>localStorage.getItem('hp12c-state')),before);assert.match(await p.locator('.lcd-readable').first().textContent(),/^5,/);
 await p.locator('.lcd').tap();await p.waitForTimeout(100);results.push({engine:name,test:'cached build reload/calculate/transfer while offline, state preserved',passed:true,feedback:await p.locator('.lcd-transfer-status').textContent()});
 }catch(e){results.push({engine:name,failed:String(e)})}finally{await browser.close()}
}
server.close();await fs.writeFile(new URL('platform-results.json',import.meta.url),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));if(results.some(x=>x.failed))process.exitCode=1;
