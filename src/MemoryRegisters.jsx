import {useState,useRef,useLayoutEffect,useEffect} from 'react';
function RegisterEditor({name,value,onSave,onClose}){
 const [draft,setDraft]=useState(value),[error,setError]=useState(''),dialog=useRef(null),field=useRef(null);
 useLayoutEffect(()=>{const el=dialog.current,previous=document.activeElement;el.showModal();field.current.focus({preventScroll:true});const fit=()=>{const v=window.visualViewport;if(v&&v.scale<=1.01){el.style.top=(v.offsetTop+12)+'px';el.style.maxHeight=Math.max(100,v.height-24)+'px'}};fit();window.visualViewport?.addEventListener('resize',fit);return()=>{window.visualViewport?.removeEventListener('resize',fit);el.close();queueMicrotask(()=>previous?.isConnected&&previous.focus({preventScroll:true}))}},[]);
 return <dialog ref={dialog} className="memory-register-editor" aria-label={`Editar ${name}`} onCancel={e=>{e.preventDefault();e.stopPropagation();onClose()}} onKeyDown={e=>{if(e.key==='Escape')e.stopPropagation()}}>
  <form onSubmit={e=>{e.preventDefault();try{onSave(draft)}catch(e){setError(e.message)}}}>
   <label>Valor de {name}<input ref={field} aria-label={`Valor de ${name}`} inputMode="decimal" value={draft} onChange={e=>setDraft(e.target.value)}/></label>
   <div><button type="submit">Salvar registrador</button><button type="button" onClick={onClose}>Cancelar</button></div>{error&&<p role="alert">{error}</p>}
  </form>
 </dialog>;
}
export function MemoryRegisters({state,onEdit,onEditingChange}){
 const [edit,setEdit]=useState(null);
 const name=i=>i<10?'R'+i:'R.'+(i-10),text=value=>state.decimalComma?String(value).replace('.',','):String(value);
 useEffect(()=>{onEditingChange?.(edit!==null);return()=>onEditingChange?.(false)},[edit,onEditingChange]);
 return <section className="memory-registers" aria-label="Registradores de memória" data-editing={edit!==null}>
 <div className="memory-register-grid">{state.registers.map((value,i)=><button key={i} aria-label={`Editar ${name(i)}: ${text(value)}`} title={`${name(i)}: ${text(value)}`} onClick={()=>setEdit(i)}><strong>{name(i)}</strong><span>{text(value)}</span></button>)}</div>
 {edit!==null&&<RegisterEditor name={name(edit)} value={text(state.registers[edit])} onClose={()=>setEdit(null)} onSave={draft=>{onEdit(edit,draft);setEdit(null)}}/>}
 </section>;
}
