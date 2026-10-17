import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {INITIAL_STATE,pressAction as jsAction,pressKey as jsKey,formatDisplay} from '../packages/core/src/engine';
import {KEY_DEFINITIONS,resolveKeyAction} from '../packages/core/src/keys';
import {pressAction as runtimeAction} from '../packages/core/src/runtime';
import {installWasm,wasmPressAction,wasmEditMemory,wasmReady} from '../packages/core/src/wasm-bridge';
const instance=(await WebAssembly.instantiate(readFileSync(new URL('../packages/core/wasm/hp12c.wasm',import.meta.url)))).instance;
installWasm(instance,INITIAL_STATE);
const normalized=(s:unknown)=>JSON.parse(JSON.stringify(s));
const actions=[...new Set(KEY_DEFINITIONS.flatMap(k=>[k.action,k.fAction,k.gAction]).filter(Boolean)), 'toggleSeparator','toggleAngular','undo','parenOpen','parenClose'];
function compare(state:any,action:string){const a=jsAction(state,action),b=wasmPressAction(state,action);expect(normalized(b),action).toEqual(normalized(a));expect(formatDisplay(b)).toBe(formatDisplay(a));return b;}
describe('Rust/Wasm parity with JavaScript reference',()=>{
 it('inverse trigonometric values, limits and domain errors agree in DEG and RAD',()=>{
  for(const angular of ['DEG','RAD'])for(const x of [-9.999999999e99,-2,-1.000000001,-1,-.9999999999,-.5,0,.5,.9999999999,1,1.000000001,2,9.999999999e99])for(const action of ['asin','acos','atan'])compare({...structuredClone(INITIAL_STATE),angular,x,input:String(x),y:7,z:8,t:9,lastX:99},action);
 });
 it('recovers ABI traps without replacing saved state or calculator errors',()=>{
  const state={...structuredClone(INITIAL_STATE),x:2,y:3};
  const bad={exports:{...instance.exports,calculate(){throw new WebAssembly.RuntimeError('test trap')}}};
  installWasm(bad as unknown as WebAssembly.Instance);
  const next=runtimeAction(state,'plus');expect(next.x).toBe(5);expect(state.x).toBe(2);expect(wasmReady()).toBe(false);
  installWasm(instance,INITIAL_STATE);const error=runtimeAction({...state,x:0},'divide');expect(error.error).toBe('Error 0');expect(wasmReady()).toBe(true);
 });
 it('all key actions, errors and display states from initial state',()=>{for(const action of actions)compare(structuredClone(INITIAL_STATE),action)});
 it('150 deterministic mixed action sequences, independent engine states',()=>{let seed=421;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32};for(let sequence=0;sequence<150;sequence++){let a=structuredClone(INITIAL_STATE),b=structuredClone(INITIAL_STATE);for(let step=0;step<80;step++){let action=actions[Math.floor(random()*actions.length)];if(['amortize','deprSL','deprSOYD','deprDB'].includes(action)&&a.x>1000)action='clx';a=jsAction(a,action);b=wasmPressAction(b,action);expect(normalized(b),`${sequence}/${step}/${action}`).toEqual(normalized(a));expect(formatDisplay(b)).toBe(formatDisplay(a));}}});
 it('decimal halfway, underflow, saturation, rounding, memory and financial fixtures',()=>{
  const patches=[{x:2.675,decimals:2},{x:1.005,decimals:2},{x:-2.5,decimals:0},{x:1.2345678915},{x:-1.2345678915},{x:9.999999999e99},{x:1e-99},{x:1e-100},{tvm:{n:300,i:.4375,pv:250000,pmt:0,fv:0,begin:false}},{x:12,tvm:{n:0,i:.4375,pv:250000,pmt:-1498.12,fv:0,begin:false}},{tvm:{n:3,i:10,pv:0,pmt:0,fv:0,begin:false},registers:[-1000,500,500,500,...Array(16).fill(0)],cashflows:[-1000,500,500,500],cashflowCounts:[1,1,1,1]},{y:4.282004,x:6.042018,tvm:{...INITIAL_STATE.tvm,i:4.75,pmt:6.75}},{y:5.142004,x:120},{program:['2','multiply','runStop'],x:7}];
  for(const patch of patches)for(const action of actions){if(['amortize','deprSL','deprSOYD','deprDB'].includes(action)&&(patch.x??0)>1000)continue;compare({...structuredClone(INITIAL_STATE),...patch},action)}
  for(let index=0;index<20;index++){const s={...structuredClone(INITIAL_STATE),cashflows:Array(20).fill(0),cashflowCounts:Array(20).fill(1)};const next=wasmEditMemory(s,index,1.2345678915);expect(next.registers[index]).toBe(1.234567892);expect(next.cashflows[index]).toBe(1.234567892);expect(next.x).toBe(s.x)}
 });
 it('shifted keys, cashflows, programs, undo and persisted state',()=>{for(const sequence of [['2','enter','3','plus'],['4','2','sto','decimal','5','clx','rcl','decimal','5'],['f','rs','2','multiply','rs','f','rs','7','rs'],['1','0','0','0','chs','g','pv','5','0','0','g','pmt','3','g','fv','f','fv'],['1','2','clx','g','minus']]){let a=structuredClone(INITIAL_STATE),b=structuredClone(INITIAL_STATE);for(const id of sequence){a=jsKey(a,id);if(id==='f'||id==='g')b=wasmPressAction(b,id==='f'?'shiftF':'shiftG');else{b=wasmPressAction(b,resolveKeyAction(id,b.shift));b.shift=null}expect(normalized(b)).toEqual(normalized(a));b=normalized(b)}}});
});
