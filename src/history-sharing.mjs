export function historyShareText(item,includeNote=false){
 if(item.entries)return historySessionText(item,includeNote);
 const date=new Date(item.time),stamp=Number.isFinite(date.getTime())?date.toLocaleString('pt-BR'):'Data indisponível';
 return `HP12C Platinum\n${item.operation}\n= ${item.display}\n${stamp}${includeNote&&item.note?'\n\nAnotação:\n'+item.note:''}`;
}
export function historySessionText(session,includeNotes=true){
 const stamp=value=>new Date(value).toLocaleString('pt-BR');
 const parts=['HP12C Platinum','Bloco de cálculo',`Início: ${stamp(session.start)}`,session.closed?`Encerrado por CLx: ${stamp(session.end)}`:'Bloco em andamento'];
 if(session.partial)parts.push('Início não confirmado: histórico limitado a 100 linhas.');
 session.entries.forEach((item,index)=>{parts.push(`\n${index+1}. ${item.operation}\n= ${item.display}`);if(includeNotes&&item.note)parts.push(`Anotação:\n${item.note}`)});
 const last=session.entries.at(-1);if(last)parts.push(`\nÚltima saída: ${last.display}`);
 return parts.join('\n');
}
export function historyPngLayout(ctx,text,width=904,maxHeight=3600){
 const pages=[[]];let height=0;
 for(const line of wrapCanvasText(ctx,text,width)){
  if(height+44>maxHeight){pages.push([]);height=0}
  pages.at(-1).push(line);height+=44;
 }
 return pages;
}
export async function createHistoryPngPages(session,includeNotes=true,{doc=document,imageUrl,signal}={}){
 checkAbort(signal);const image=new Image();image.src=imageUrl;
 await Promise.all([new Promise((resolve,reject)=>{if(image.complete&&image.naturalWidth)resolve();else{image.onload=resolve;image.onerror=()=>reject(new Error('Foto indisponível. Compartilhe o texto.'))}}),doc.fonts?.ready]);checkAbort(signal);
 const canvas=doc.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)throw new Error('Imagem indisponível. Compartilhe o texto.');
 try{
  ctx.font='32px Arial';const pages=historyPngLayout(ctx,historySessionText(session,includeNotes));const blobs=[];
  for(let index=0;index<pages.length;index++){
   checkAbort(signal);canvas.width=1000;canvas.height=180+pages[index].length*44;
   const scale=Math.max(canvas.width/image.naturalWidth,canvas.height/image.naturalHeight);
   ctx.drawImage(image,0,0,image.naturalWidth*scale,image.naturalHeight*scale);ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(0,0,canvas.width,canvas.height);
   ctx.textBaseline='top';ctx.font='bold 36px Arial';ctx.fillStyle='#68bdff';ctx.fillText(`HP12C · Página ${index+1}/${pages.length}`,48,40);
   ctx.font='32px Arial';ctx.fillStyle='#f2f4e9';pages[index].forEach((line,row)=>ctx.fillText(line,48,110+row*44));
   blobs.push(await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Não foi possível criar a imagem. Compartilhe o texto.')),'image/png')));checkAbort(signal);
  }
  return blobs;
 }finally{canvas.width=0;canvas.height=0}
}
export function canHistoryShare(data,nav=globalThis.navigator){
 try{return typeof nav.share==='function'&&(data.files?typeof nav.canShare==='function'&&nav.canShare({files:data.files}):!nav.canShare||nav.canShare(data))}catch{return false}
}
export function shareHistory(data,{nav=globalThis.navigator}={}){
 try{if(!canHistoryShare(data,nav))return Promise.resolve('unavailable');
  // Called synchronously from a fresh button click, never after preparing PNG.
  return Promise.resolve(nav.share(data)).then(()=>'shared',e=>e?.name==='AbortError'?'cancelled':'failed');
 }catch(e){return Promise.resolve(e?.name==='AbortError'?'cancelled':'failed')}
}
export function copyHistoryImage(blob,{nav=globalThis.navigator,Item=globalThis.ClipboardItem}={}){
 try{if(!nav.clipboard?.write||!Item||Item.supports&&!Item.supports('image/png'))return Promise.resolve(false);
  return Promise.resolve(nav.clipboard.write([new Item({'image/png':blob})])).then(()=>true,()=>false);
 }catch{return Promise.resolve(false)}
}
export function wrapCanvasText(ctx,text,width){
 const lines=[];for(const paragraph of String(text).split('\n')){let line='';for(const char of Array.from(paragraph)){if(line&&ctx.measureText(line+char).width>width){lines.push(line);line=''}line+=char}lines.push(line)}return lines;
}
function checkAbort(signal){if(signal?.aborted)throw signal.reason||new DOMException('Exportação cancelada.','AbortError')}
export async function createHistoryPng(item,includeNote=false,{doc=document,imageUrl,signal}={}){
 checkAbort(signal);
 const image=new Image();image.src=imageUrl;
 await Promise.all([new Promise((resolve,reject)=>{if(image.complete&&image.naturalWidth)resolve();else{image.onload=resolve;image.onerror=()=>reject(new Error('A foto do quadro não está disponível. Compartilhe o texto.'))}}),doc.fonts?.ready,doc.fonts?.load?.('700 48px MemoryScript')]);
 checkAbort(signal);
 const canvas=doc.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)throw new Error('Imagem indisponível. Compartilhe o texto.');
 try{
 const width=1000,padding=48,area=width-2*padding;
 ctx.font='32px Arial';const operation=wrapCanvasText(ctx,item.operation,area);
 ctx.font='bold 44px Arial';const result=wrapCanvasText(ctx,'= '+item.display,area);
 ctx.font='28px Arial';const date=new Date(item.time),stamp=Number.isFinite(date.getTime())?date.toLocaleString('pt-BR'):'Data indisponível';const dates=wrapCanvasText(ctx,stamp,area);
 ctx.font='30px Arial';const notes=includeNote&&item.note?wrapCanvasText(ctx,item.note,area):[];
 const height=190+operation.length*44+result.length*58+dates.length*40+(notes.length?70+notes.length*42:0);
 if(height>8192)throw new Error('A nota é longa para uma imagem. Desmarque a nota ou compartilhe o texto completo.');
 canvas.width=width;canvas.height=height;const scale=Math.max(width/image.naturalWidth,height/image.naturalHeight);
 ctx.drawImage(image,(width-image.naturalWidth*scale)/2,(height-image.naturalHeight*scale)/2,image.naturalWidth*scale,image.naturalHeight*scale);
 ctx.shadowColor='#000';ctx.shadowBlur=3;ctx.shadowOffsetY=1;ctx.textBaseline='top';let y=padding;
 ctx.fillStyle='#68bdff';ctx.font='bold 48px MemoryScript, Arial';ctx.fillText('HP12C Platinum',padding,y);y+=76;
 const draw=(lines,font,lineHeight,color)=>{ctx.font=font;ctx.fillStyle=color;for(const line of lines){ctx.fillText(line,padding,y);y+=lineHeight}};
 draw(operation,'32px Arial',44,'#f2f4e9');draw(result,'bold 44px Arial',58,'#f2f4e9');y+=12;draw(dates,'28px Arial',40,'#f2f4e9');
 if(notes.length){y+=24;draw(['Anotação'],'bold 30px Arial',42,'#f2f4e9');draw(notes,'30px Arial',42,'#f2f4e9')}
 return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Não foi possível criar a imagem. Compartilhe o texto.')),'image/png')).then(blob=>{checkAbort(signal);return blob});
 }finally{canvas.width=0;canvas.height=0}
}
