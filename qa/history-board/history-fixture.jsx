// Browser-only regression fixture: live history updates while reading older rows.
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {HistoryBoard} from '../../src/HistoryBoard.jsx';
window.rows=Array.from({length:100},(_,i)=>({id:String(i),time:'2026-10-05T21:00:00.000Z',operation:'Operação '+i,display:String(i),value:i}));
function Fixture(){const [rows,set]=useState(window.rows);window.updateBoard=set;return <HistoryBoard history={rows} onClose={()=>{}}/>}
let host=document.getElementById('history-fixture');if(!host){host=document.createElement('div');host.id='history-fixture';document.body.appendChild(host)}window.fixtureRoot ||=createRoot(host);window.fixtureRoot.render(<Fixture/>);
