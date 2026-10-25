import {Script} from 'scripting';
import {createNativeStore} from './host-state.mjs';

async function run(){
 const web=new WebViewController();
 const store=createNativeStore(Storage);
 await web.addScriptMessageHandler('hpRead',()=>store.read());
 await web.addScriptMessageHandler('hpSave',params=>store.save(params));
 await web.addScriptMessageHandler('hpHaptic',()=>{HapticFeedback.lightImpact();return true});
 await web.addScriptMessageHandler('hpExport',async text=>{
  if(typeof text!=='string'||text.length>1024*1024)throw new Error('Backup inválido.');
  const paths=await DocumentPicker.exportFiles({files:[{name:`hp12c-backup-${new Date().toISOString().slice(0,10)}.json`,data:Data.fromUTF8(text)}]});
  return paths.length>0;
 });
 await web.addScriptMessageHandler('hpImport',async()=>{
  const paths=await DocumentPicker.pickFiles({types:['public.json'],allowsMultipleSelection:false});
  if(!paths.length)return null;
  try{const text=await FileManager.readAsString(paths[0]);if(text.length>1024*1024)throw new Error('Backup muito grande.');return text}
  finally{DocumentPicker.stopAcessingSecurityScopedResources()}
 });
 // No navigation to remote content: handlers are privileged to this local bundle.
 web.shouldAllowRequest=async request=>/^(file:|data:|blob:|about:)/.test(request.url);
 try{
  if(!await web.loadFile(`${Script.directory}/web/index.html`,`${Script.directory}/web`))throw new Error('Não foi possível carregar o pacote local.');
  await web.present({fullscreen:true});
  // Also flush after presentation dismisses, before releasing the bridge.
  await web.evaluateJavaScript('return window.hp12cFlush?.()');
 }finally{web.dispose();Script.exit()}
}
run().catch(error=>{console.error('HP12C:',String(error));Script.exit()});
