import type { CalculatorState } from './engine';
type WasmExports = {memory:WebAssembly.Memory;alloc:(n:number)=>number;dealloc:(p:number,n:number)=>void;calculate:(p:number,n:number)=>bigint};
let wasm:WasmExports|null=null;
const encoder=new TextEncoder(),decoder=new TextDecoder();
function invoke(exports:WasmExports,request:unknown):CalculatorState {
 // JSON normally collapses -0 to 0; keep the sign because Intl formatting
 // can display it after stack swaps. Pick a token absent from user state.
 const plain=JSON.stringify(request);let token='__hp12c_negative_zero__';
 while(plain.includes(token))token+='x';
 const json=JSON.stringify(request,(_key,value)=>typeof value==='number'&&Object.is(value,-0)?token:value).split(JSON.stringify(token)).join('-0.0');
 const bytes=encoder.encode(json);
 const input=exports.alloc(bytes.length);let output=0,length=0;
 try{new Uint8Array(exports.memory.buffer,input,bytes.length).set(bytes);const packed=exports.calculate(input,bytes.length);output=Number(packed&0xffffffffn);length=Number(packed>>32n);const next=JSON.parse(decoder.decode(new Uint8Array(exports.memory.buffer,output,length)));if(next.abiError)throw new Error(next.abiError);return next;}
 finally{exports.dealloc(input,bytes.length);if(output)exports.dealloc(output,length);}
}
export function installWasm(instance:WebAssembly.Instance,probe?:CalculatorState){
 const exports=instance.exports as unknown as WasmExports;
 if(!exports.memory||!exports.calculate||!exports.alloc||!exports.dealloc)throw new Error('Invalid calculator Wasm ABI');
 if(probe){const next=invoke(exports,{state:{...probe,x:2,y:3},action:'plus'});if(next.x!==5||next.error)throw new Error('Calculator Wasm self-test failed');}
 wasm=exports;
}
export function disableWasm(){wasm=null;}
export function wasmReady(){return wasm!==null;}
export function wasmPressAction(state:CalculatorState,action:string,executing=false):CalculatorState{
 if(!wasm)throw new Error('Calculator Wasm is not ready');
 return invoke(wasm,{state,action,executing});
}
export function wasmEditMemory(state:CalculatorState,index:number,value:number):CalculatorState{
 if(!wasm)throw new Error('Calculator Wasm is not ready');
 return invoke(wasm,{state,action:'',operation:'editMemory',index,value});
}
