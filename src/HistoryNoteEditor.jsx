import {useState} from 'react';
import {HistoryDialog} from './HistoryDialog';
import {NOTE_LIMIT} from './history-notes.mjs';
export function HistoryNoteEditor({item,onSave,onClose}){
 const [draft,setDraft]=useState(item.note||''),[error,setError]=useState(''),[deleted,setDeleted]=useState(null);
 const save=()=>{try{onSave(draft);onClose()}catch(e){setError(e.message)}};
 const remove=()=>{try{const previous=item.note;onSave('');setDeleted(previous);setDraft('');setError('')}catch(e){setError(e.message)}};
 const undo=()=>{try{onSave(deleted);setDraft(deleted);setDeleted(null);setError('')}catch(e){setError(e.message)}};
 return <HistoryDialog label="Anotação do cálculo" onClose={onClose}>
  <h2>Anotação do cálculo</h2><p className="history-dialog-calculation">{item.operation}<strong>= {item.display}</strong></p>
  <form onSubmit={e=>{e.preventDefault();save()}}>
   <label>Nota<textarea data-initial-focus value={draft} maxLength={NOTE_LIMIT} rows={5} onChange={e=>setDraft(e.target.value)} placeholder="Descreva este cálculo…"/></label>
   <small>{draft.length}/{NOTE_LIMIT} · Salva neste aparelho</small>
   {error&&<p role="alert">{error}</p>}
   {deleted!==null&&<p role="status">Anotação excluída. <button type="button" onClick={undo}>Desfazer exclusão</button></p>}
   <footer><button type="submit">Salvar nota</button><button type="button" onClick={onClose}>Cancelar</button>{item.note&&<button type="button" onClick={remove}>Excluir nota</button>}</footer>
  </form>
 </HistoryDialog>;
}
