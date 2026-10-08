import {it,expect} from 'vitest';
import {createDeferredPersistence} from '../src/deferred-persistence.mjs';
it('coalesces input, writes changed fields only and flushes latest state on exit',()=>{
 let timer:any,idle:any;const writes:any[]=[];
 const clock={setTimeout:f=>(timer=f,1),clearTimeout:()=>timer=null,requestIdleCallback:f=>(idle=f,2),cancelIdleCallback:()=>idle=null};
 const p=createDeferredPersistence((key,value)=>writes.push([key,value]),clock),history=[];
 for(let i=0;i<100;i++)p.update({state:{x:i},history});
 expect(writes).toEqual([]);timer();expect(writes).toEqual([]);idle();expect(writes).toEqual([['state','{"x":99}'],['history','[]']]);
 p.update({state:{x:100},history});p.flush();expect(writes.slice(2)).toEqual([['state','{"x":100}']]);expect(timer).toBeNull();expect(idle).toBeNull();
});
it('falls back without idle callbacks and retries failed writes without losing pending state',()=>{
 let timer:any,failed=true;const writes:any[]=[];
 const p=createDeferredPersistence((key,value)=>{if(failed)throw Error('quota');writes.push([key,value])},{setTimeout:f=>(timer=f,1),clearTimeout:()=>timer=null});
 p.update({state:42});timer();expect(writes).toEqual([]);failed=false;p.flush();expect(writes).toEqual([['state','42']]);
});
