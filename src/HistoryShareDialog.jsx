import {useEffect,useRef,useState} from 'react';
import {HistoryDialog} from './HistoryDialog';
import {historyShareText,createHistoryPng,shareHistory,canHistoryShare,copyHistoryImage} from './history-sharing.mjs';
import {transferDisplay} from './display-transfer.mjs';
export function HistoryShareDialog({item,onClose}){
 const [includeNote,setIncludeNote]=useState(false),[image,setImage]=useState(null),[imageError,setImageError]=useState(''),[status,setStatus]=useState(''),[busy,setBusy]=useState(false);
 const readyImage=image&&image.includeNote===includeNote;
 const text=historyShareText(item,includeNote),textRef=useRef(null),busyRef=useRef(false),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[]);
 useEffect(()=>{let active=true,url;const controller=new AbortController();setImage(null);setImageError('');
  createHistoryPng(item,includeNote,{signal:controller.signal,imageUrl:new URL(`${import.meta.env.BASE_URL}assets/memory-board-photo.jpeg`,location.href).href}).then(blob=>{if(!active)return;url=URL.createObjectURL(blob);setImage({blob,url,includeNote,file:new File([blob],'hp12c-calculo.png',{type:'image/png'})})}).catch(e=>{if(active)setImageError(e.message)});
  return()=>{active=false;controller.abort();if(url)URL.revokeObjectURL(url)};
 },[item,includeNote]);
 const report=value=>{if(alive.current)setStatus(value)};
 const copy=()=>transferDisplay(text,false).then(r=>{report(r.copied?'Texto copiado.':'Selecione o texto para copiar.');if(!r.copied&&alive.current){textRef.current.focus();textRef.current.select()}});
 const download=()=>{if(!readyImage)return;const a=document.createElement('a');a.href=image.url;a.download='hp12c-calculo.png';document.body.append(a);a.click();a.remove();report('Download da imagem solicitado.')};
 const share=kind=>{if(busyRef.current||kind==='image'&&!readyImage)return;
  const data=kind==='image'?{files:[image.file],title:'Cálculo HP12C'}:{text,title:'Cálculo HP12C'};
  if(!canHistoryShare(data)){kind==='image'?download():copy();return}
  busyRef.current=true;setBusy(true);setStatus('');
  const result=shareHistory(data);
  // Fallbacks keep their own explicit button available if activation has expired.
  result.then(value=>{if(!alive.current)return;if(value==='unavailable'){kind==='image'?download():copy()}else if(value==='failed')report('Não foi possível compartilhar. Use copiar ou baixar.');else if(value==='shared')report('Compartilhamento concluído.');}).finally(()=>{busyRef.current=false;if(alive.current)setBusy(false)});
 };
 return <HistoryDialog label="Compartilhar cálculo" onClose={onClose}>
  <h2>Compartilhar cálculo</h2><p>Escolha texto ou imagem.</p>
  {item.note&&<label className="history-share-note"><input type="checkbox" checked={includeNote} onChange={e=>setIncludeNote(e.target.checked)} disabled={busy}/> Incluir anotação</label>}
  <textarea ref={textRef} className="history-share-text" aria-label="Texto do cálculo para compartilhar" readOnly value={text} rows={5}/>
  <div className="history-share-actions"><button data-initial-focus disabled={busy} onClick={()=>share('text')}>Compartilhar texto</button><button disabled={busy} onClick={copy}>Copiar texto</button>
   <button disabled={busy||!readyImage} onClick={()=>share('image')}>Compartilhar imagem</button>
   {navigator.clipboard?.write&&globalThis.ClipboardItem&&<button disabled={busy||!readyImage} onClick={()=>copyHistoryImage(image.blob).then(ok=>report(ok?'Imagem copiada.':'Não foi possível copiar a imagem. Use baixar.'))}>Copiar imagem</button>}
   <button disabled={busy||!readyImage} onClick={download}>Baixar PNG</button></div>
  {!readyImage&&!imageError&&<p role="status">Preparando imagem…</p>}{imageError&&<p role="alert">{imageError}</p>}
  {readyImage&&<img className="history-share-preview" src={image.url} alt="Prévia da imagem deste cálculo"/>}
  <p role="status" aria-live="polite">{status}</p><footer><button onClick={onClose}>Fechar</button></footer>
 </HistoryDialog>;
}
