// Keep serialization and synchronous storage writes out of rapid input bursts.
export function createDeferredPersistence(write,clock=globalThis){
 const saved=new Map(),pending=new Map();let timer=null,idle=null;
 const cancel=()=>{if(timer!==null)clock.clearTimeout(timer);if(idle!==null)clock.cancelIdleCallback(idle);timer=idle=null};
 const flush=()=>{cancel();for(const [key,value]of pending){try{write(key,JSON.stringify(value));saved.set(key,value);pending.delete(key)}catch{}}};
 const update=values=>{cancel();for(const [key,value]of Object.entries(values)){if(saved.has(key)&&saved.get(key)===value)pending.delete(key);else pending.set(key,value)}if(pending.size)timer=clock.setTimeout(()=>{timer=null;if(clock.requestIdleCallback)idle=clock.requestIdleCallback(flush,{timeout:1000});else flush()},500)};
 return {update,flush,cancel};
}
