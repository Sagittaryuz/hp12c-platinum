import {isScripting,nativeCall} from './scripting-bridge.mjs';
// Feedback is optional: failure must never prevent a calculator action.
export function createKeyFeedback({win=globalThis.window,doc=globalThis.document,nav=globalThis.navigator,now=()=>performance.now()}={}){
 let context=null,pending=null,pendingVibration=null;
 const reset=()=>{const old=context;context=null;pending=null;pendingVibration=null;try{Promise.resolve(old?.close()).catch(()=>{})}catch{}};
 const play=ctx=>{
  const tick=pending;if(!tick||context!==ctx||ctx.state!=='running'||doc.hidden)return;
  pending=null;if(now()-tick.time>250)return;
  try{const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.frequency.value=880;gain.gain.setValueAtTime(.035,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.035);oscillator.connect(gain);gain.connect(ctx.destination);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect()};oscillator.start();oscillator.stop(ctx.currentTime+.04)}catch{reset()}
 };
 const resume=ctx=>{try{Promise.resolve(ctx.resume()).then(()=>play(ctx)).catch(()=>{if(context===ctx&&ctx.state==='closed')reset()})}catch{if(context===ctx)reset()}};
 return {reset,
  unlock(enabled,vibration=false){if(doc.hidden)return;if(vibration&&pendingVibration!==null){const time=pendingVibration;pendingVibration=null;if(now()-time<=250)try{nav.vibrate?.(12)}catch{}}if(enabled&&context){if(context.state==='closed')reset();else if(context.state!=='running')resume(context)}},
  press({sound=false,vibration=false}={}){
   if(doc.hidden)return;
   pendingVibration=null;
   if(vibration&&isScripting)void nativeCall('hpHaptic').catch(()=>{});
   if(vibration&&!isScripting)try{if(typeof nav.vibrate==='function')pendingVibration=nav.vibrate(12)===false?now():null}catch{}
   if(!sound)return;
   try{if(context?.state==='closed')reset();const Context=win.AudioContext||win.webkitAudioContext;if(!Context)return;context ||= new Context();pending={time:now()};if(context.state==='running')play(context);else resume(context)}catch{reset()}
  }
 };
}
export function bindFeedbackLifecycle(feedback,{win=window,doc=document,enabled=()=>true}={}){
 const unlock=()=>{const preference=enabled();feedback.unlock(typeof preference==='boolean'?preference:preference.sound,typeof preference==='object'&&preference.vibration)},hidden=()=>{if(doc.hidden)feedback.reset()},reset=()=>feedback.reset();
 const events=[[win,'pointerup',unlock],[win,'touchend',unlock],[win,'keydown',unlock],[win,'pagehide',reset],[doc,'visibilitychange',hidden],[doc,'freeze',reset]];
 for(const [target,type,fn]of events)target.addEventListener(type,fn,true);
 return()=>{for(const [target,type,fn]of events)target.removeEventListener(type,fn,true);reset()};
}
