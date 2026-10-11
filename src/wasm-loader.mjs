import wasmUrl from '../packages/core/wasm/hp12c.wasm?url';
import {installWasm,INITIAL_STATE} from '@sagittaryuz/hp12c-core';
export async function loadCalculatorWasm(){
 const started=performance.now();
 try {
  const response=await fetch(wasmUrl);
  if(!response.ok)throw new Error(`Wasm HTTP ${response.status}`);
  let result;
  try{result=await WebAssembly.instantiateStreaming(response.clone(),{})}
  catch{result=await WebAssembly.instantiate(await response.arrayBuffer(),{})}
  // Test before switching; activation doesn't replace or restore live state.
  const exports=result.instance.exports;if(!exports.memory||!exports.calculate)throw new Error('Invalid Wasm module');
  installWasm(result.instance,INITIAL_STATE);
  document.documentElement.dataset.calculatorEngine='rust-wasm';
  performance.measure('hp12c-wasm-load',{start:started,end:performance.now()});
  return true;
 }catch(error){
  document.documentElement.dataset.calculatorEngine='javascript-fallback';
  console.warn('HP12C: Rust/Wasm unavailable; keeping the local JavaScript engine.',error);
  return false;
 }
}
