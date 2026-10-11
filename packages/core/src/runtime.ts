import {pressAction as javascriptPressAction,pressKey as javascriptPressKey} from './engine';
import type {CalculatorState} from './engine';
import {resolveKeyAction} from './keys';
import {wasmPressAction,wasmReady,disableWasm} from './wasm-bridge';
export {INITIAL_STATE,restoreState,formatDisplay,parseDate} from './engine';
export type {CalculatorState,CalcMode} from './engine';
export {installWasm,wasmReady} from './wasm-bridge';
export function pressAction(state:CalculatorState,action:string,executing=false):CalculatorState {
 // Calculator errors are returned in state; only an ABI/trap failure disables
 // Wasm. Both engines are pure: recovery retries the original unchanged state.
 if(wasmReady())try{return wasmPressAction(state,action,executing)}catch(error){
  disableWasm();if(typeof document!=='undefined')document.documentElement.dataset.calculatorEngine='javascript-fallback';
  console.warn('HP12C: Wasm bridge failed; retaining state with JavaScript fallback.',error);
 }
 return javascriptPressAction(state,action,executing);
}
export function pressKey(state:CalculatorState,id:string):CalculatorState {
 if(!wasmReady())return javascriptPressKey(state,id);
 if(id==='f'||id==='g')return pressAction(state,id==='f'?'shiftF':'shiftG');
 const next=pressAction(state,resolveKeyAction(id,state.shift));next.shift=null;return next;
}
