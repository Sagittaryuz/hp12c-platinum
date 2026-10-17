import {it,expect,vi} from 'vitest';
import {createKeyFeedback,bindFeedbackLifecycle} from '../src/key-feedback.mjs';
function setup(){
 const contexts:any[]=[],win:any=new EventTarget(),doc:any=new EventTarget();doc.hidden=false;let time=0;
 win.AudioContext=class{state='suspended';currentTime=1;destination={};nodes:any[]=[];resume=vi.fn(()=>{this.state='running';return Promise.resolve()});close=vi.fn(()=>{this.state='closed';return Promise.resolve()});constructor(){contexts.push(this)}createOscillator(){const n={frequency:{value:0},connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn(),onended:null};this.nodes.push(n);return n}createGain(){return {gain:{setValueAtTime:vi.fn(),exponentialRampToValueAtTime:vi.fn()},connect:vi.fn(),disconnect:vi.fn()}}};
 const nav:any={vibrate:vi.fn(()=>true)},feedback=createKeyFeedback({win,doc,nav,now:()=>time});return {win,doc,nav,feedback,contexts,advance:(n:number)=>time+=n};
}
const flushed=async()=>{await Promise.resolve();await Promise.resolve()};
it('retries a rejected haptic once on release activation, without a delayed vibration queue',()=>{const h=setup();h.nav.vibrate.mockReturnValue(false);h.feedback.press({vibration:true});h.feedback.unlock(false,true);h.feedback.unlock(false,true);expect(h.nav.vibrate).toHaveBeenCalledTimes(2);h.feedback.press({vibration:true});h.advance(300);h.feedback.unlock(false,true);expect(h.nav.vibrate).toHaveBeenCalledTimes(3)});
it('resumes within interaction, plays one short tick and releases its nodes',async()=>{
 const h=setup();h.feedback.press({sound:true,vibration:true});expect(h.contexts[0].resume).toHaveBeenCalledOnce();await flushed();const n=h.contexts[0].nodes[0];expect(n.start).toHaveBeenCalledOnce();expect(n.stop).toHaveBeenCalledWith(1.04);n.onended();expect(n.disconnect).toHaveBeenCalledOnce();expect(h.nav.vibrate).toHaveBeenCalledWith(12);
});
it('recovers suspended/interrupted contexts and recreates a closed context',async()=>{
 const h=setup();h.feedback.press({sound:true});await flushed();for(const state of ['suspended','interrupted']){h.contexts[0].state=state;h.feedback.press({sound:true});await flushed()}expect(h.contexts[0].nodes).toHaveLength(3);h.contexts[0].state='closed';h.feedback.press({sound:true});await flushed();expect(h.contexts).toHaveLength(2);expect(h.contexts[1].nodes).toHaveLength(1);
});
it('discards late audio and never queues a burst after autoplay or a screen lock',async()=>{
 const h=setup();h.feedback.press({sound:true});await flushed();const ctx=h.contexts[0];let resume:any;ctx.state='interrupted';ctx.resume=()=>new Promise(r=>{resume=()=>{ctx.state='running';r(null)}});h.feedback.press({sound:true});h.advance(300);resume();await flushed();expect(ctx.nodes).toHaveLength(1);
 h.feedback.press({sound:true});expect(ctx.nodes).toHaveLength(2);h.doc.hidden=true;h.feedback.press({sound:true,vibration:true});expect(ctx.nodes).toHaveLength(2);expect(h.nav.vibrate).not.toHaveBeenCalled();
});
it('feedback failures and unsupported vibration never block calculator input',async()=>{
 const h=setup();h.nav.vibrate=()=>{throw new Error('blocked')};expect(()=>h.feedback.press({sound:true,vibration:true})).not.toThrow();await flushed();expect(h.contexts[0].nodes).toHaveLength(1);h.contexts[0].resume=()=>Promise.reject(new Error('denied'));h.contexts[0].state='suspended';h.feedback.press({sound:true});await flushed();expect(()=>h.feedback.reset()).not.toThrow();
});
it('hidden/pagehide/freeze releases audio; next foreground press can restart, including StrictMode cleanup',async()=>{
 const h=setup();let detach=bindFeedbackLifecycle(h.feedback,{win:h.win,doc:h.doc});h.feedback.press({sound:true});await flushed();h.doc.hidden=true;h.doc.dispatchEvent(new Event('visibilitychange'));expect(h.contexts[0].close).toHaveBeenCalledOnce();h.doc.hidden=false;h.feedback.press({sound:true});await flushed();expect(h.contexts).toHaveLength(2);h.win.dispatchEvent(new Event('pagehide'));h.feedback.press({sound:true});await flushed();h.doc.dispatchEvent(new Event('freeze'));detach();detach=bindFeedbackLifecycle(h.feedback,{win:h.win,doc:h.doc});h.feedback.press({sound:true});await flushed();expect(h.contexts.at(-1).nodes).toHaveLength(1);detach();
});
