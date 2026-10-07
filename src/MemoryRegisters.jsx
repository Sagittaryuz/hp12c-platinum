import {useState} from 'react';
export function MemoryRegisters({state,onEdit}){
 const [edit,setEdit]=useState(null),[draft,setDraft]=useState(''),[error,setError]=useState('');
 const name=i=>i<10?'R'+i:'R.'+(i-10),text=value=>state.decimalComma?String(value).replace('.',','):String(value);
 return <section className="memory-registers" aria-label="Registradores de memória"><h2>Memórias R0–R.9</h2><p>20 registradores. Editar preserva X e a pilha; os fluxos existentes seguem as mesmas regras de STO.</p>
 <div className="memory-register-grid">{state.registers.map((value,i)=><button key={i} aria-label={`Editar ${name(i)}`} onClick={()=>{setError('');setEdit(i);setDraft(text(value))}}><strong>{name(i)}</strong><span>{text(value)}</span></button>)}</div>
 {edit!==null&&<form onSubmit={e=>{e.preventDefault();try{onEdit(edit,draft);setEdit(null);setError('')}catch(e){setError(e.message)}}}><label>Valor de {name(edit)}<input autoFocus aria-label={`Valor de ${name(edit)}`} inputMode="decimal" value={draft} onChange={e=>setDraft(e.target.value)}/></label><button type="submit">Salvar registrador</button><button type="button" onClick={()=>{setEdit(null);setError('')}}>Cancelar</button>{error&&<p role="alert">{error}</p>}</form>}
 </section>;
}
