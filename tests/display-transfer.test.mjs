import {test} from 'node:test';import assert from 'node:assert/strict';
import {transferDisplay,bindDisplayGestures,legacyCopy} from '../src/display-transfer.mjs';
test('copy starts before share, neither awaits clipboard, exact displayed text',async()=>{
 const calls=[];let resolve;const nav={clipboard:{writeText:t=>{calls.push(['copy',t]);return new Promise(r=>resolve=r)}},share:d=>{calls.push(['share',d]);return Promise.resolve()}};
 const pending=transferDisplay('-1.234,5000000',true,{nav});assert.deepEqual(calls,[['copy','-1.234,5000000'],['share',{text:'-1.234,5000000'}]]);resolve();assert.equal((await pending).copied,true);
});
for(const [name,nav,expected] of [
 ['cancel share',{clipboard:{writeText:()=>Promise.resolve()},share:()=>Promise.reject({name:'AbortError'})},{copied:true,shared:'cancelled'}],
 ['reject clipboard independently',{clipboard:{writeText:()=>Promise.reject()},share:()=>Promise.resolve()},{copied:false,shared:'shared'}],
 ['reject share',{clipboard:{writeText:()=>Promise.resolve()},share:()=>Promise.reject({name:'NotAllowedError'})},{copied:true,shared:'failed'}],
 ['share absent',{clipboard:{writeText:()=>Promise.resolve()}},{copied:true,shared:'unavailable'}],
 ['canShare rejects data',{clipboard:{writeText:()=>Promise.resolve()},canShare:()=>false,share:()=>{throw Error('must not call')}},{copied:true,shared:'unavailable'}],
 ['synchronous API exceptions',{clipboard:{writeText:()=>{throw Error()}},share:()=>{throw Error()}},{copied:false,shared:'failed'}]
])test(name,async()=>{const r=await transferDisplay('0,0000000',true,{nav});assert.deepEqual({copied:r.copied,shared:r.shared},expected)});
function harness(){
 const win=new EventTarget(),doc=new EventTarget(),el=new EventTarget();el.contains=t=>t===el;el.setPointerCapture=()=>{};el.getBoundingClientRect=()=>({left:0,top:0,right:100,bottom:50});let time=0;const calls=[];
 const cleanup=bindDisplayGestures(el,s=>calls.push(s),{win,doc,now:()=>time});
 const fire=(type,props={},target=win)=>{const e=new Event(type,{cancelable:true});const {target:ignored,...values}=props;Object.assign(e,{pointerId:1,button:0,isPrimary:true,clientX:20,clientY:20,...values});Object.defineProperty(e,'target',{value:props.target||el});target.dispatchEvent(e);return e};
 return {win,doc,el,calls,cleanup,fire,advance:t=>time=t};
}
test('tap and hold release each execute once despite synthetic click',()=>{for(const [time,share]of [[100,false],[500,true],[15000,true]]){const h=harness();h.fire('pointerdown');h.advance(time);h.fire('pointerup');h.fire('click',{detail:1},h.el);h.fire('click',{detail:0,pointerType:'touch'},h.el);assert.deepEqual(h.calls,[share]);h.cleanup()}});
for(const scenario of ['drag','exit','cancel','capture','blur','hide','pagehide','multitouch'])test('cancel '+scenario,()=>{
 const h=harness();h.fire('pointerdown');h.advance(600);
 if(scenario==='drag')h.fire('pointermove',{clientX:35});
 if(scenario==='exit')h.fire('pointermove',{clientX:110});
 if(scenario==='cancel')h.fire('pointercancel');
 if(scenario==='capture')h.fire('lostpointercapture',{},h.el);
 if(scenario==='blur')h.fire('blur');
 if(scenario==='pagehide')h.fire('pagehide');
 if(scenario==='hide'){h.doc.hidden=true;h.fire('visibilitychange',{},h.doc)}
 if(scenario==='multitouch')h.fire('pointerdown',{pointerId:2,target:{}});
 h.fire('pointerup');h.fire('click',{detail:1},h.el);assert.deepEqual(h.calls,[]);h.cleanup();
});
test('release movement is checked without move event',()=>{const h=harness();h.fire('pointerdown');h.fire('pointerup',{clientX:45});assert.deepEqual(h.calls,[]);h.cleanup()});
test('accessible click, keyboard copy/share and repeated key ignored',()=>{const h=harness();h.fire('click',{detail:0},h.el);h.fire('keydown',{key:'Enter'},h.el);h.fire('keydown',{key:' ',shiftKey:true},h.el);h.fire('keydown',{key:'Enter',repeat:true},h.el);assert.deepEqual(h.calls,[false,false,true]);h.cleanup()});
test('cleanup removes activation handlers',()=>{const h=harness();h.cleanup();h.fire('pointerdown');h.fire('pointerup');h.fire('click',{detail:0},h.el);assert.deepEqual(h.calls,[])});
test('legacy copy only writes, cleans up and restores focus and selection',()=>{
 const log=[],field={setAttribute(){},style:{},focus(){log.push('focusTemp')},select(){log.push('select')},remove(){log.push('remove')}};
 const doc={activeElement:{focus(){log.push('restoreFocus')}},getSelection:()=>({rangeCount:1,getRangeAt:()=>({cloneRange:()=>1}),removeAllRanges(){log.push('clearSelection')},addRange(){log.push('restoreRange')}}),createElement:()=>field,body:{append(){}},execCommand:name=>{assert.equal(name,'copy');assert.equal(field.value,'9,00');return true}};
 assert.equal(legacyCopy('9,00',doc),true);assert.deepEqual(log,['focusTemp','select','remove','restoreFocus','clearSelection','restoreRange']);
});
test('missing copy APIs gives manual fallback result',async()=>{const doc={createElement:()=>({style:{},setAttribute(){},focus(){},select(){},remove(){}}),body:{append(){}}};assert.equal((await transferDisplay('Error',false,{nav:{},doc})).copied,false)});
