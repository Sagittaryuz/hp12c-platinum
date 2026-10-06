import{it,expect,vi}from'vitest';
import{animatePanel,panelCoverage,blurForCoverage,PANEL_DURATION,PANEL_EASING}from'../src/panel-motion.mjs';
it('amostra progresso WAAPI com easing, sem consultar geometria; conclusão usa alvo',async()=>{
 const {el,native}=surface();let progress=.73;native.effect={getComputedTiming:()=>({progress})};
 const queued=new Map<number,()=>void>();let id=0;const win=el.ownerDocument.defaultView;
 win.requestAnimationFrame=(fn:()=>void)=>{queued.set(++id,fn);return id};win.cancelAnimationFrame=(id:number)=>queued.delete(id);
 const sample=vi.fn();const a=animatePanel(el,[{},{}],260,{onFrame:sample});expect(sample).toHaveBeenLastCalledWith(.73);
 progress=.91;const [key,frame]=[...queued][0];queued.delete(key);frame();expect(sample).toHaveBeenLastCalledWith(.91);
 native.finish();await a.finished;expect(sample).toHaveBeenLastCalledWith(1);expect(queued.size).toBe(0);
});
function surface(reduced=false){let resolve:any,reject:any;const native:any={playState:'running',finished:new Promise((ok,no)=>{resolve=ok;reject=no}),finish:vi.fn(()=>{native.playState='finished';resolve()}),cancel:vi.fn(()=>{native.playState='idle';reject(new Error('cancelled'))})};const el:any={style:{},ownerDocument:{defaultView:{matchMedia:()=>({matches:reduced}),setTimeout,clearTimeout}},animate:vi.fn(()=>native)};return{el,native}}
it('termina animação com relógio travado sem bloquear painel, uma vez',async()=>{vi.useFakeTimers();try{const{el,native}=surface();const a=animatePanel(el,[{transform:'translateY(-20px)'},{transform:'translateY(0)'}]);await vi.advanceTimersByTimeAsync(410);await a.finished;expect(native.finish).toHaveBeenCalledTimes(1);await vi.advanceTimersByTimeAsync(1000);expect(native.finish).toHaveBeenCalledTimes(1)}finally{vi.useRealTimers()}});
it('cancelamento limpa deadline e pausa explícita não é forçada',async()=>{vi.useFakeTimers();try{const{el,native}=surface();native.playState='paused';const a=animatePanel(el,[{},{}]);const done=a.finished.catch(()=>null);await vi.advanceTimersByTimeAsync(820);expect(native.finish).not.toHaveBeenCalled();a.cancel();await done;await vi.advanceTimersByTimeAsync(1000);expect(native.finish).not.toHaveBeenCalled();expect(vi.getTimerCount()).toBe(0)}finally{vi.useRealTimers()}});
it('movimento reduzido e ausência de WAAPI aplicam estado final imediatamente',async()=>{for(const reduced of[true,false]){const{el}=surface(reduced);if(!reduced)delete el.animate;const a=animatePanel(el,[{transform:'translateY(30px)'},{transform:'translateY(0)'}]);await a.finished;expect(el.style.transform).toBe('translateY(0)');expect(el.animate?.mock.calls.length||0).toBe(0)}});

it('blur segue cobertura geométrica, é simétrico e termina a95% em ambas as direções',()=>{
 expect(panelCoverage(-100,100)).toBe(0);expect(panelCoverage(100,100)).toBe(0);expect(panelCoverage(-50,100)).toBe(.5);expect(panelCoverage(50,100)).toBe(.5);expect(panelCoverage(0,100)).toBe(1);
 for(const p of [0,.05,.95,1])expect(blurForCoverage(p)).toBe(0);
 expect(blurForCoverage(.5)).toBe(3);expect(blurForCoverage(.9)).toBeGreaterThan(0);expect(blurForCoverage(.9)).toBeLessThan(.11);
 for(let i=0;i<=100;i++)expect(blurForCoverage(i/100)).toBeCloseTo(blurForCoverage(1-i/100),10);
 expect(blurForCoverage(.949999)).toBeLessThan(.000001);expect(blurForCoverage(.050001)).toBeLessThan(.000001);expect(blurForCoverage(NaN)).toBe(0);
});
it('frame acompanha movimento real e cancelamento elimina callbacks, inclusive conclusão já enfileirada',async()=>{
 vi.useFakeTimers();try{
  const {el,native}=surface();const queued=new Map<number,()=>void>();let serial=0;const win=el.ownerDocument.defaultView;win.requestAnimationFrame=(fn:()=>void)=>{queued.set(++serial,fn);return serial};win.cancelAnimationFrame=(id:number)=>queued.delete(id);
  const onFrame=vi.fn();const a=animatePanel(el,[{transform:'translateY(-100px)'},{transform:'translateY(0)'}],PANEL_DURATION,{onFrame});
  expect(el.animate).toHaveBeenCalledWith(expect.anything(),{duration:PANEL_DURATION,easing:PANEL_EASING,fill:'both'});expect(onFrame).toHaveBeenCalledTimes(1);
  const [id,frame]=[...queued][0];queued.delete(id);frame();expect(onFrame).toHaveBeenCalledTimes(2);native.finish();a.cancel();await a.finished;expect(onFrame).toHaveBeenCalledTimes(2);expect(queued.size).toBe(0);expect(vi.getTimerCount()).toBe(0);
 }finally{vi.useRealTimers()}
});
it('conclusão/reduced-motion/fallback amostram alvo e não deixam frame pendente',async()=>{
 const {el,native}=surface();const queued=new Map<number,()=>void>();const win=el.ownerDocument.defaultView;win.requestAnimationFrame=(fn:()=>void)=>{queued.set(1,fn);return 1};win.cancelAnimationFrame=(id:number)=>queued.delete(id);const frame=vi.fn();const a=animatePanel(el,[{},{}],PANEL_DURATION,{onFrame:frame});native.finish();await a.finished;expect(frame).toHaveBeenCalledTimes(2);expect(queued.size).toBe(0);
 for(const reduced of [true,false]){const {el}=surface(reduced);if(!reduced)delete el.animate;const frame=vi.fn(()=>expect(el.style.transform).toBe('translateY(0)'));await animatePanel(el,[{transform:'translateY(-20px)'},{transform:'translateY(0)'}],PANEL_DURATION,{onFrame:frame}).finished;expect(frame).toHaveBeenCalledTimes(1)}
});
