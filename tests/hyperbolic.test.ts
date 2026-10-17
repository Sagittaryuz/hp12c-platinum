import {describe,it,expect} from 'vitest';
import {INITIAL_STATE,pressKey,pressAction,restoreState,resolveKeyAction,KEY_DEFINITIONS,formatDisplay,type CalculatorState} from '@sagittaryuz/hp12c-core';
import {reducePanel} from '../src/hp-panel-state.mjs';
const start=()=>structuredClone(INITIAL_STATE);
const keys=(s:CalculatorState,...ids:string[])=>ids.reduce(pressKey,s);
const cases=[['sin','sinh',1.175201194],['cos','cosh',1.543080635],['tan','tanh',.761594156]] as const;
describe('g hyperbolic functions',()=>{
 it.each(cases)('%s maps to %s without replacing its f inverse',(id,action,expected)=>{
  const definition=KEY_DEFINITIONS.find(k=>k.id===id)!;
  expect(definition.g).toBe(action.toUpperCase());expect(resolveKeyAction(id,'g')).toBe(action);expect(resolveKeyAction(id,'f')).toBe('a'+id);
  for(const angular of ['DEG','RAD'] as const){
   const before={...start(),x:1,input:'1',angular,y:7,z:8,t:9,lastX:99,entering:true};
   const next=keys(before,'g',id);expect(next.x).toBe(expected);expect(next.error).toBeNull();expect(next.angular).toBe(angular);expect(next.displayLabel).toBe(action.toUpperCase());
   expect([next.y,next.z,next.t,next.lastX]).toEqual([7,8,9,1]);expect(next.shift).toBeNull();expect(next.entering).toBe(false);expect(next.lift).toBe(true);
   expect(keys(next,'g','plus').x).toBe(1);expect(before.x).toBe(1);expect(before.lastX).toBe(99);
  }
 });
 it('has exact zero values, odd/even symmetry and finite large tanh',()=>{
  for(const [action,zero,sign] of [['sinh',0,-1],['cosh',1,1],['tanh',0,-1]] as const){
   expect(pressAction(start(),action).x).toBe(zero);
   for(const x of [.000000001,.5,2,20]){const positive=pressAction({...start(),x},action),negative=pressAction({...start(),x:-x},action);expect(positive.error).toBeNull();expect(negative.x).toBe(sign*positive.x);expect(Number.isFinite(positive.x)).toBe(true);}
  }
  for(const x of [1000,-1000,9.999999999e99,-9.999999999e99]){const s=pressAction({...start(),x},'tanh');expect(s.x).toBe(Math.sign(x));expect(s.error).toBeNull();}
 });
 it('retains calculator saturation for finite results and rejects floating overflow atomically',()=>{
  for(const action of ['sinh','cosh']){
   for(const x of [231,-231,700,-700]){const s=pressAction({...start(),x},action);expect(s.x).toBe(action==='sinh'?Math.sign(x)*9.999999999e99:9.999999999e99);expect(s.error).toBeNull();}
   for(const x of [1000,-1000]){const before={...start(),x,y:7,z:8,t:9,lastX:99},s=pressAction(before,action);expect(s.error).toBe('Error 0');expect([s.x,s.y,s.z,s.t,s.lastX]).toEqual([x,7,8,9,99]);expect([s.x,s.y,s.z,s.t,s.lastX].every(Number.isFinite)).toBe(true);expect(keys(s,'clx','clx','1','g','tan').x).toBe(.761594156);}
  }
 });
 it.each(cases)('preserves pending ALG state and persists a %s program',(id,action,value)=>{
  const s=keys(start(),'f','eex','2','plus','1','g',id);expect(s.x).toBe(value);expect(s.algOperands).toEqual([2]);expect(s.pendingOp).toBe('+');expect(pressKey(s,'enter').x).toBeCloseTo(2+value,8);
  let p=keys(start(),'f','rs','1','g',id);expect(p.program).toEqual(['1',action]);p=restoreState(JSON.parse(JSON.stringify(p)));p=keys(p,'f','rs','rs');expect(p.x).toBe(value);expect(p.error).toBeNull();
 });
 it('records each G result or overflow once while preserving prior history and notes',()=>{
  const time='2026-10-17T14:42:00.000Z',dependencies={initial:INITIAL_STATE,pressAction,pressKey,formatDisplay,displayDefaults:s=>s};
  for(const [id,x,action,value]of [['sin',1,'sinh',1.175201194],['cos',1,'cosh',1.543080635],['tan',1,'tanh',.761594156],['sin',1000,'sinh',null]] as const){
   const old={id:'old',time,operation:'2 + 3',display:'5',value:5,note:'Keep'};let p:any={state:{...start(),x,input:String(x)},history:[old]};
   for(const key of ['g',id])p=reducePanel(p,{type:'key',id:key,action:resolveKeyAction(key,p.state.shift),eventId:key,time},dependencies);
   expect(p.history).toHaveLength(2);expect(p.history[0]).toEqual(old);expect(p.history[1].operation).toBe(`${action} (${x})`);expect(p.history[1].value).toBe(value);if(value===null)expect(p.history[1].kind).toBe('error');
  }
 });
});
