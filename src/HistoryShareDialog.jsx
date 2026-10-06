import {useEffect,useRef,useState} from 'react';
import {HistoryDialog} from './HistoryDialog';
import {historySessionText,createHistoryPngPages,shareHistory,canHistoryShare,copyHistoryImage} from './history-sharing.mjs';
import {sessionHasNotes} from './history-sessions.mjs';
import {transferDisplay} from './display-transfer.mjs';
export function HistoryShareDialog({item,onClose}){
 const [includeNote,setIncludeNote]=useState(true),[image,setImage]=useState(null),[imageError,setImageError]=useState(''),[status,setStatus]=useState(''),[busy,setBusy]=useState(false);
 const readyImage=image&&image.includeNote===includeNote;
 const text=historySessionText(item,includeNote),textRef=useRef(null),busyRef=useRef(false),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[]);
 useEffect(()=>{let active=true;const urls=[],controller=new AbortController();setImage(null);setImageError('');
  createHistoryPngPages(item,includeNote,{signal:controller.signal,imageUrl:new URL(`${import.meta.env.BASE_URL}assets/memory-board-photo.jpeg`,location.href).href}).then(blobs=>{if(!active)return;const pages=blobs.map((blob,index)=>{const url=URL.createObjectURL(blob);urls.push(url);return {blob,url,file:new File([blob],`hp12c-bloco-${index+1}.png`,{type:'image/png'})}});setImage({pages,includeNote})}).catch(e=>{if(active)setImageError(e.message)});
  return()=>{active=false;controller.abort();urls.forEach(url=>URL.revokeObjectURL(url))};
 },[item,includeNote]);
 const report=value=>{if(alive.current)setStatus(value)};
 const copy=()=>transferDisplay(text,false).then(r=>{report(r.copied?'Texto copiado.':'Selecione o texto para copiar.');if(!r.copied&&alive.current){textRef.current.focus();textRef.current.select()}});
 const download=page=>{const a=document.createElement('a');a.href=page.url;a.download=page.file.name;document.body.append(a);a.click();a.remove();report('Download da página solicitado.')};
 const fallback=kind=>{if(kind==='text')copy();else if(image.pages.length===1)download(image.pages[0]);else report('Baixe cada página pelos botões abaixo ou compartilhe o texto completo.')};
 const share=kind=>{if(busyRef.current||kind==='image'&&!readyImage)return;
  const data=kind==='image'?{files:image.pages.map(page=>page.file),title:'Bloco HP12C'}:{text,title:'Bloco HP12C'};
  if(!canHistoryShare(data)){fallback(kind);return}
  busyRef.current=true;setBusy(true);setStatus('');
  shareHistory(data).then(value=>{if(!alive.current)return;if(value==='unavailable')fallback(kind);else if(value==='failed')report('Não foi possível compartilhar. Use copiar ou baixar.');else if(value==='shared')report('Compartilhamento concluído.')}).finally(()=>{busyRef.current=false;if(alive.current)setBusy(false)});
 };
 return <HistoryDialog label="Compartilhar bloco" onClose={onClose}>
  <h2>Compartilhar bloco</h2><p>Operações entre CLx, em ordem cronológica. Blocos longos geram várias páginas PNG.</p>
  {sessionHasNotes(item)&&<label className="history-share-note"><input type="checkbox" checked={includeNote} onChange={e=>setIncludeNote(e.target.checked)} disabled={busy}/> Incluir anotações</label>}
  <textarea ref={textRef} className="history-share-text" aria-label="Texto do bloco para compartilhar" readOnly value={text} rows={8}/>
  <div className="history-share-actions"><button data-initial-focus disabled={busy} onClick={()=>share('text')}>Compartilhar texto</button><button disabled={busy} onClick={copy}>Copiar texto</button><button disabled={busy||!readyImage} onClick={()=>share('image')}>Compartilhar imagem</button></div>
  {!readyImage&&!imageError&&<p role="status">Preparando imagem.</p>}{imageError&&<p role="alert">{imageError}</p>}
  {readyImage&&<div className="history-share-pages">{image.pages.map((page,index)=><figure key={page.url}><figcaption>Página {index+1} de {image.pages.length}</figcaption><img className="history-share-preview" src={page.url} alt={`Bloco de cálculo, página ${index+1}`}/><button disabled={busy} onClick={()=>download(page)}>Baixar PNG {image.pages.length>1?index+1:''}</button>{navigator.clipboard?.write&&globalThis.ClipboardItem&&<button disabled={busy} onClick={()=>copyHistoryImage(page.blob).then(ok=>report(ok?'Imagem copiada.':'Não foi possível copiar. Use baixar.'))}>Copiar imagem {image.pages.length>1?index+1:''}</button>}</figure>)}</div>}
  <p role="status" aria-live="polite">{status}</p><footer><button onClick={onClose}>Fechar</button></footer>
 </HistoryDialog>;
}
