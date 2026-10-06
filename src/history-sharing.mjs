export function historyShareText(item,includeNote=false){
 const date=new Date(item.time),stamp=Number.isFinite(date.getTime())?date.toLocaleString('pt-BR'):'Data indisponível';
 return `HP12C Platinum\n${item.operation}\n= ${item.display}\n${stamp}${includeNote&&item.note?'\n\nAnotação:\n'+item.note:''}`;
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
export async function createHistoryPng(item,includeNote=false,{doc=document,imageUrl}={}){
 const image=new Image();image.src=imageUrl;
 await Promise.all([new Promise((resolve,reject)=>{if(image.complete&&image.naturalWidth)resolve();else{image.onload=resolve;image.onerror=()=>reject(new Error('A foto do quadro não está disponível. Compartilhe o texto.'))}}),doc.fonts?.ready,doc.fonts?.load?.('700 48px MemoryScript')]);
 const canvas=doc.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)throw new Error('Imagem indisponível. Compartilhe o texto.');
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
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Não foi possível criar a imagem. Compartilhe o texto.')),'image/png'));
}
