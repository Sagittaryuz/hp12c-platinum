import {createRequire} from 'node:module';import fs from 'node:fs/promises';const require=createRequire(import.meta.url);const {chromium}=require('C:/Users/mrpir/AppData/Local/Temp/hp12c-perf-tools/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});const page=await browser.newPage({viewport:{width:402,height:874}});await page.goto('http://127.0.0.1:5198');await page.waitForTimeout(400);
const results=[];
for(const afterMenu of [false,true]){if(afterMenu){await page.locator('.brand').click();await page.waitForTimeout(300);await page.keyboard.press('Escape');await page.locator('.hp-menu').waitFor({state:'detached'})}
 await page.mouse.move(200,20);await page.mouse.down();await page.mouse.move(200,130,{steps:6});await page.mouse.up();await page.waitForTimeout(350);
 const opened=await page.locator('.history-board').count()===1;results.push({afterMenu,opened});if(opened){await page.keyboard.press('Escape');await page.locator('.history-board').waitFor({state:'detached'})}
}
await browser.close();console.log(results);await fs.writeFile(new URL((process.argv[2]||'pull')+'.json',import.meta.url),JSON.stringify(results,null,2));
