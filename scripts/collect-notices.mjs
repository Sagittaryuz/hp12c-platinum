import fs from 'node:fs';
import path from 'node:path';
const notices=[];
function visitModules(root){if(!fs.existsSync(root))return;for(const name of fs.readdirSync(root)){if(name.startsWith('.'))continue;const dir=path.join(root,name);if(name.startsWith('@')){for(const child of fs.readdirSync(dir))visitPackage(path.join(dir,child));}else visitPackage(dir);}}
function visitPackage(dir){const file=path.join(dir,'package.json');if(!fs.existsSync(file))return;const pkg=JSON.parse(fs.readFileSync(file,'utf8'));const files=fs.readdirSync(dir).filter(name=>/^(licen[cs]e|copying|notice)(\.|$|[-_])/i.test(name)&&fs.statSync(path.join(dir,name)).isFile());notices.push(`${pkg.name} ${pkg.version}\nLicense: ${typeof pkg.license==='string'?pkg.license:JSON.stringify(pkg.license)||'see package'}\n${files.map(name=>fs.readFileSync(path.join(dir,name),'utf8')).join('\n')}`);visitModules(path.join(dir,'node_modules'));}
visitModules('node_modules');fs.mkdirSync('public/legal',{recursive:true});fs.writeFileSync('public/legal/third-party-notices.txt',`Third-party notices\nThese licenses apply to third-party components only. Original project: copyright 2026 Sagittaryuz, all rights reserved.\n\n${notices.sort().join('\n\n'+'='.repeat(72)+'\n\n')}`);
console.log(`Preserved notices for ${notices.length} packages.`);
