import {build} from 'vite';
import {readFile,writeFile,mkdir,cp,rm,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
process.env.SCRIPTING_BUILD='1';process.env.VITE_HP12C_ENGINE='javascript';
const version=JSON.parse(await readFile('package.json','utf8')).version;
const root='dist/scripting/HP12C Platinum';
await rm('dist/scripting',{recursive:true,force:true});await mkdir(root,{recursive:true});
await build({plugins:[{name:'scripting-local-css',enforce:'pre',async transform(code,id){if(!id.endsWith('.css'))return;return replaceAsync(code,/url\((['"]?)(\/[^)'"\s]+)\1\)/g,async(match,q,url)=>{const bytes=await readFile('public'+url);const ext=path.extname(url);const mime={'.woff2':'font/woff2','.svg':'image/svg+xml','.jpeg':'image/jpeg','.png':'image/png'}[ext];if(!mime)throw new Error('Unknown asset '+url);return `url(data:${mime};base64,${bytes.toString('base64')})`})}}],build:{outDir:`${root}/web`,rollupOptions:{output:{format:'iife',}}}});
let html=await readFile(`${root}/web/index.html`,'utf8');
// Classic inline JS avoids WKWebView file:// ES-module CORS restrictions.
html=await replaceAsync(html,/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g,async(_,url)=>`<script>${(await readFile(path.join(root,'web',url),'utf8')).replaceAll('</script','<\\/script')}</script>`);
const inlineScript=html.match(/<script>[\s\S]*?<\/script>/)?.[0];
if(!inlineScript)throw new Error('Missing classic bundle');
html=html.replace(inlineScript,'').replace('</body>',()=>inlineScript+'</body>');
// Embed CSS and fonts, so font loading also has no file-origin CORS dependency.
html=await replaceAsync(html,/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,async(_,url)=>{
 let css=await readFile(path.join(root,'web',url),'utf8');
 css=await replaceAsync(css,/url\((['"]?)([^)'"\s]+)\1\)/g,async(match,q,resource)=>{
  if(!/\.woff2?(?:\?|$)/.test(resource))return match;
  const font=await readFile(path.resolve(path.dirname(path.join(root,'web',url)),resource));return `url(data:font/woff2;base64,${font.toString('base64')})`;
 });
 // CSS was moved from assets/ into index.html.
 css=css.replaceAll('url(./','url(./assets/').replaceAll('url(../','url(./');
 return `<style>${css}</style>`;
});
html=html.replace(/<link rel="modulepreload"[^>]+>/g,'').replace(/<link rel="preload"[^>]+>/g,'');
await writeFile(`${root}/web/index.html`,html);
// The classic bundle is now inline; the native variant never loads WASM/3D.
await rm(`${root}/web/models`,{recursive:true,force:true});
for(const file of await readdir(`${root}/web/assets`))if(/\.(js|wasm)$/.test(file)||['brushed-aluminum.png','hp12c-front.webp','black-brush.svg'].includes(file))await rm(`${root}/web/assets/${file}`);
await build({configFile:false,publicDir:false,define:{'import.meta.env.VITE_SCRIPTING_BUILD':'"1"'},build:{outDir:root,emptyOutDir:false,lib:{entry:'scripting/index.tsx',formats:['es'],fileName:()=> 'index.tsx'},rollupOptions:{external:['scripting']},minify:false}});
await writeFile(`${root}/metadata.json`,JSON.stringify({name:'HP12C Platinum',version,icon:'function',color:'#c6c6c6',description:'HP12C local; dados privados, motor JavaScript e vibração nativa.'},null,2));
await cp('scripting/README.md',`${root}/README.md`);
await cp('COPYRIGHT.md',`${root}/COPYRIGHT.md`);
const archive=`hp12c-platinum-scripting-${version}.zip`;
execFileSync('python3',['-c',`import zipfile, pathlib\nr=pathlib.Path(${JSON.stringify(root)})\nwith zipfile.ZipFile(${JSON.stringify('dist/scripting/'+archive)},'w',zipfile.ZIP_DEFLATED) as z:\n for p in sorted(r.rglob('*')):\n  if p.is_file(): z.write(p,p.relative_to(r))`]);
console.log(`Scripting: dist/scripting/${archive}`);
async function replaceAsync(input,regex,replace){const matches=[...input.matchAll(regex)];for(const match of matches.reverse())input=input.slice(0,match.index)+await replace(...match)+input.slice(match.index+match[0].length);return input}
