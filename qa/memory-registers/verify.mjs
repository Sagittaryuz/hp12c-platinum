import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.argv[2]||'http://127.0.0.1:5199/';
const output=process.env.QA_OUTPUT||new URL('.',import.meta.url).pathname;
await fs.mkdir(output,{recursive:true});
const fixture=JSON.parse(await fs.readFile(new URL('../responsive-calculator/fixture.json',import.meta.url),'utf8'));
const values=[123.4567891,-1234567891,9.87654321e98,1.23456789e-99,0,-0.0001234567891,1234567890,0.1234567891,-9.87654321e98,1e-99];
const history=[{id:'kept',time:'2026-10-07T11:00:00Z',operation:'2.5 + 100',display:'102,500',value:102.5,note:'Nota preservada'}];
const name=i=>i<10?`R${i}`:`R.${i-10}`;
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const results=[];
try{
 for(const viewport of [{width:320,height:450},{width:320,height:568},{width:360,height:800},{width:393,height:852},{width:844,height:390},{width:1280,height:800}])for(const decimalComma of [true,false]){
  const mobile=viewport.width<900,context=await browser.newContext({viewport,hasTouch:mobile,isMobile:mobile,deviceScaleFactor:mobile?2:1,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  const state={...fixture,decimalComma,decimals:decimalComma?4:7,fixed:decimalComma,registers:[...values,...values],cashflows:[...values,...values],cashflowCounts:Array(20).fill(1)};
  await context.addInitScript(({state,history})=>{if(!localStorage.getItem('hp12c-qa-seeded')){localStorage.setItem('hp12c-state',JSON.stringify(state));localStorage.setItem('hp12c-default-program','equivalent-rate-v1');localStorage.setItem('hp12c-default-display','user-display-preferences-v3');localStorage.setItem('hp12c-history-v1',JSON.stringify(history));localStorage.setItem('hp12c-qa-seeded','1')}},{state,history});
  const ready=async()=>{await page.waitForFunction(()=>document.querySelector('.calculator')?.classList.contains('joined-frame'));await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(220)};
  const saved=()=>page.evaluate(()=>({state:JSON.parse(localStorage.getItem('hp12c-state')),history:JSON.parse(localStorage.getItem('hp12c-history-v1'))}));
  const open=async()=>{await page.evaluate(()=>document.activeElement?.blur());const r=await page.locator('.silver-panel').boundingBox();await page.mouse.move(r.x+r.width/2,r.y+20);await page.mouse.down();await page.mouse.move(r.x+r.width/2,r.y+110,{steps:6});await page.mouse.up();await page.locator('.history-board[open]').waitFor();await page.waitForTimeout(300)};
  await page.goto(base);await ready();const before=await saved(),display=await page.locator('output.lcd-readable').innerText();
  await page.locator('.brand').click();const version=await page.locator('.hp-menu-version').innerText();assert.equal(version,'v0.2.40');await page.getByRole('button',{name:'Fechar menu',exact:true}).click();await page.locator('.hp-menu').waitFor({state:'detached'});
  await open();const grid=page.locator('.memory-register-grid'),buttons=grid.locator('button');assert.equal(await buttons.count(),20);
  const measure=async()=>grid.evaluate(el=>{const lines=el.closest('.history-board-lines');return{viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,linesWidth:lines.clientWidth,linesScrollWidth:lines.scrollWidth,gridWidth:el.clientWidth,gridScrollWidth:el.scrollWidth,rects:[...el.querySelectorAll('button')].map(b=>{const r=b.getBoundingClientRect(),s=getComputedStyle(b),span=b.querySelector('span');return{name:b.querySelector('strong').textContent,x:r.x,y:r.y,width:r.width,height:r.height,aria:b.getAttribute('aria-label'),title:b.title,value:span.textContent,whiteSpace:getComputedStyle(span).whiteSpace,ellipsis:getComputedStyle(span).textOverflow,font:s.fontSize}})}});
  const layout=await measure(),rowTops=[...new Set(layout.rects.map(r=>r.y))];assert.equal(rowTops.length,2);
  assert.deepEqual(layout.rects.slice(0,10).map(r=>r.name),Array.from({length:10},(_,i)=>name(i)));assert.deepEqual(layout.rects.slice(10).map(r=>r.name),Array.from({length:10},(_,i)=>name(i+10)));
  assert.ok(layout.documentWidth<=viewport.width);assert.equal(layout.linesWidth,layout.linesScrollWidth);assert.equal(layout.gridWidth,layout.gridScrollWidth);
  for(const [i,r]of layout.rects.entries()){assert.equal(r.y,rowTops[i<10?0:1]);assert.ok(r.width>=24&&r.height>=44);assert.ok(r.x>=0&&r.x+r.width<=viewport.width);assert.equal(r.aria,`Editar ${name(i)}: ${r.value}`);assert.equal(r.title,`${name(i)}: ${r.value}`);assert.equal(r.whiteSpace,'nowrap');assert.equal(r.ellipsis,'ellipsis')}
  await buttons.first().focus();for(let i=1;i<20;i++){await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement?.querySelector('strong')?.textContent),name(i))}
  await page.screenshot({path:`${output}/${viewport.width}x${viewport.height}-${decimalComma?'comma':'point'}-memory.png`});
  for(let i=0;i<20;i++){
   const full=String(before.state.registers[i]).replace('.',decimalComma?',':'.');
   if(mobile)await buttons.nth(i).tap();else{await buttons.nth(i).focus();await page.keyboard.press('Enter')}
   const input=page.getByRole('textbox',{name:`Valor de ${name(i)}`,exact:true});assert.equal(await input.inputValue(),full);assert.ok(await input.evaluate(el=>el===document.activeElement));
   await input.fill(full);await page.getByRole('button',{name:'Salvar registrador',exact:true}).click();await input.waitFor({state:'detached'});
  }
  await page.waitForTimeout(220);assert.deepEqual(await saved(),before);
  await buttons.nth(19).click();const input=page.getByRole('textbox',{name:'Valor de R.9',exact:true});await input.fill(decimalComma?'987654321,123456789':'987654321.123456789');
  await input.scrollIntoViewIfNeeded();await page.screenshot({path:`${output}/${viewport.width}x${viewport.height}-${decimalComma?'comma':'point'}-editor.png`});
  const editing=await measure();assert.equal(editing.linesWidth,editing.linesScrollWidth);assert.ok(editing.documentWidth<=viewport.width);
  await page.getByRole('button',{name:'Salvar registrador',exact:true}).click();await page.waitForTimeout(220);const edited=await saved();
  assert.equal(edited.state.registers[19],987654321.1);assert.equal(edited.state.cashflows[19],987654321.1);const expected=structuredClone(before);expected.state.registers[19]=987654321.1;expected.state.cashflows[19]=987654321.1;assert.deepEqual(edited,expected);
  await buttons.nth(19).click();assert.equal(await input.inputValue(),decimalComma?'987654321,1':'987654321.1');await input.fill('1e101');await page.getByRole('button',{name:'Salvar registrador',exact:true}).click();await page.getByRole('alert').waitFor();assert.deepEqual(await saved(),edited);await page.getByRole('button',{name:'Cancelar',exact:true}).click();
  await buttons.first().click();await page.getByRole('textbox',{name:'Valor de R0',exact:true}).fill('999');await page.getByRole('button',{name:'Cancelar',exact:true}).click();assert.deepEqual(await saved(),edited);
  await page.getByRole('button',{name:'Voltar à calculadora',exact:true}).click();await page.locator('.history-board').waitFor({state:'detached'});assert.equal(await page.locator('output.lcd-readable').innerText(),display);
  await page.reload();await ready();assert.deepEqual(await saved(),edited);assert.equal(await page.locator('output.lcd-readable').innerText(),display);await open();await buttons.nth(19).click();assert.equal(await input.inputValue(),decimalComma?'987654321,1':'987654321.1');await page.getByRole('button',{name:'Cancelar',exact:true}).click();assert.deepEqual(errors,[]);
  results.push({url:base,version,browser:await browser.version(),viewport,decimalComma,fixed:state.fixed,decimals:state.decimals,layout,all20FullValueEditors:true,keyboardOrder:true,trustedTouch:mobile,precision10Digits:true,stackProgramHistoryFormatPreserved:true,invalidAndCancelPreserved:true,reloadPreserved:true,errors});console.log(`${viewport.width}x${viewport.height} ${decimalComma?'comma FIX':'point SCI'} passed`);await context.close();
 }
 await fs.writeFile(`${output}/results.json`,JSON.stringify(results,null,2)+'\n');
}finally{await browser.close()}
