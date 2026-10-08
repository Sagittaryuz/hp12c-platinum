import { KEY_BY_ID, resolveKeyAction, type Shift } from './keys';

export type CalcMode = 'RPN' | 'ALG';
type FinancialKey = 'n'|'i'|'pv'|'pmt'|'fv';
type Tvm = { n:number; i:number; pv:number; pmt:number; fv:number; begin:boolean };
export type CalculatorState = {
  schemaVersion:2; x:number; y:number; z:number; t:number; lastX:number; input:string; entering:boolean; lift:boolean;
  financialInputReady:boolean; shift:Shift; mode:CalcMode; error:string|null; decimals:number; fixed:boolean; powered:boolean; decimalComma:boolean;
  registers:number[]; tvm:Tvm; cashflows:number[]; cashflowCounts:number[]; compoundOdd:boolean;
  pendingRegister:'store'|'recall'|null; registerDot:boolean; storeOp:string|null; pendingGoto:string|null; gotoPosition:boolean;
  pendingOp:string|null; algOperands:number[]; algOperators:string[]; programMode:boolean; program:string[]; programPrefix:string[]; pc:number;
  paused:boolean; running:boolean; angular:'DEG'|'RAD'; dateFormat:'MDY'|'DMY'; displayLabel:string; displayOverride:string|null;
  correlationUndefined:boolean; undoState:Omit<CalculatorState,'undoState'>|null;
};
export const INITIAL_STATE:CalculatorState = {
  schemaVersion:2,x:0,y:0,z:0,t:0,lastX:0,input:'0',entering:false,lift:false,financialInputReady:false,shift:null,mode:'RPN',
  error:null,decimals:2,fixed:true,powered:true,decimalComma:false,registers:Array(20).fill(0),tvm:{n:0,i:0,pv:0,pmt:0,fv:0,begin:false},
  cashflows:[0],cashflowCounts:[1],compoundOdd:false,pendingRegister:null,registerDot:false,storeOp:null,pendingGoto:null,
  gotoPosition:false,pendingOp:null,algOperands:[],algOperators:[],programMode:false,program:[],programPrefix:[],pc:0,paused:false,running:false,
  angular:'DEG',dateFormat:'MDY',displayLabel:'PRONTO',displayOverride:null,correlationUndefined:false,undoState:null,
};
const clone = (s:CalculatorState):CalculatorState => structuredClone(s);
const precision = (n:number):number => {
  if (Number.isNaN(n)) throw new Error('Error 0');
  if (Math.abs(n)>9.999999999e99) return Math.sign(n)*9.999999999e99;
  return Math.abs(n)<1e-99 ? 0 : Number(n.toPrecision(10));
};
function lift(s:CalculatorState) { s.t=s.z; s.z=s.y; s.y=s.x; }
function result(s:CalculatorState,n:number,label?:string,last=true) {
  s.correlationUndefined=false;
  if(last) s.lastX=s.x;
  s.x=precision(n); s.input=String(s.x); s.entering=false; s.lift=true; s.financialInputReady=true;
  s.displayLabel=label || 'RESULTADO';
}
function recallValue(s:CalculatorState,n:number,label:string) { if(s.lift && s.mode==='RPN') lift(s); result(s,n,label,false); }
function drop(s:CalculatorState) { s.y=s.z; s.z=s.t; }
function valueOp(a:number,b:number,op:string) { if((op==='/'&&b===0)||(op==='^'&&((a===0&&b<=0)||(a<0&&!Number.isInteger(b)))))throw new Error('Error 0'); return op==='+'?a+b:op==='-'?a-b:op==='*'?a*b:op==='/'?a/b:Math.pow(a,b); }
function binary(s:CalculatorState,op:string) { result(s,valueOp(s.y,s.x,op)); drop(s); }
function algReduce(s:CalculatorState) {
  const op=s.algOperators.pop(); if(!op || op==='(') return;
  const b=s.algOperands.pop(), a=s.algOperands.pop(); if(a===undefined || b===undefined) throw new Error('Error 0');
  s.algOperands.push(precision(valueOp(a,b,op)));
}
function algPush(s:CalculatorState,op:string) {
  if (s.displayLabel==='ALG OP' && s.pendingOp && s.algOperators.at(-1) === s.pendingOp) { s.algOperators[s.algOperators.length-1]=op; s.pendingOp=op; return; }
  s.algOperands.push(s.x);
  while(s.algOperators.length && s.algOperators.at(-1)!=='(') algReduce(s);
  s.algOperators.push(op); s.x=s.algOperands.at(-1)!; s.pendingOp=op; s.entering=false; s.lift=false; s.displayLabel='ALG OP';
}
function algEquals(s:CalculatorState) {
  if(s.algOperators.length) { s.algOperands.push(s.x); while(s.algOperators.length) algReduce(s); result(s,s.algOperands.pop() ?? s.x); }
  s.y=s.x; s.entering=false; s.lift=false; s.financialInputReady=true;
  s.algOperands=[]; s.algOperators=[]; s.pendingOp=null;
}
function root(fn:(x:number)=>number,guess=0.1,low=-.99999999,high=10000):number {
  let x=Math.max(low,Math.min(high,guess));
  for(let n=0;n<80;n++) { const y=fn(x); if(Math.abs(y)<1e-8) return x; const h=Math.max(1e-7,Math.abs(x)*1e-5); const derivative=(fn(x+h)-fn(x-h))/(2*h); if(!Number.isFinite(derivative)||Math.abs(derivative)<1e-14) break; const next=x-y/derivative; if(!Number.isFinite(next)||next<=low||next>=high) break; if(Math.abs(next-x)<1e-12) return next; x=next; }
  const points=[low,...Array.from({length:2000},(_,k)=>low+(high-low)*k/1999),...Array.from({length:1000},(_,k)=>Math.exp(Math.log(1+low)+(Math.log(1+Math.min(high,1e4))-Math.log(1+low))*k/999)-1)].filter(v=>v>=low&&v<=high).sort((a,b)=>a-b);
  let a=points[0],fa=fn(a); const brackets:Array<[number,number]>=[];
  for(const b of points.slice(1)){const fb=fn(b); if(Number.isFinite(fa)&&Number.isFinite(fb)&&fa*fb<=0) brackets.push([a,b]); a=b;fa=fb;}
  if(!brackets.length) throw new Error('Error 5');
  let [l,r]=brackets.sort((a,b)=>Math.abs((a[0]+a[1])/2-guess)-Math.abs((b[0]+b[1])/2-guess))[0]; let fl=fn(l);
  for(let k=0;k<180;k++){ const m=(l+r)/2,fm=fn(m); if(Math.abs(fm)<1e-9 || Math.abs(r-l)<1e-12) return m; if(fl*fm<=0)r=m;else{l=m;fl=fm;} }
  return (l+r)/2;
}
function tvmCoefficients(s:CalculatorState,n=s.tvm.n,r=s.tvm.i/100) {
  if(r<=-1||n<0) throw new Error('Error 5');
  const whole=Math.floor(n),fraction=n-whole;
  const odd=s.compoundOdd?Math.pow(1+r,fraction):1+r*fraction;
  const periods=fraction>1e-10?whole:n;
  const discount=Math.pow(1+r,-periods);
  return {pv:odd,pmt:Math.abs(r)<1e-12?periods:(1-discount)/r*(s.tvm.begin?1+r:1),fv:discount};
}
function equation(s:CalculatorState,n=s.tvm.n,r=s.tvm.i/100){const c=tvmCoefficients(s,n,r);return s.tvm.pv*c.pv+s.tvm.pmt*c.pmt+s.tvm.fv*c.fv;}
function financial(s:CalculatorState,key:FinancialKey) {
  if(s.financialInputReady){s.tvm[key]=s.x;s.financialInputReady=false;s.entering=false;s.lift=true;s.displayLabel=key.toUpperCase();return;}
  if(s.tvm.i<=-100||(key==='i'&&(s.tvm.n<=0||s.tvm.n>=1e10)))throw new Error('Error 5');
  let value:number;
  if(key==='n') { const base=s.tvm.n; s.tvm.n=Math.ceil(root(n=>{const r=s.tvm.i/100,d=Math.pow(1+r,-n);return s.tvm.pv+s.tvm.pmt*(Math.abs(r)<1e-12?n:(1-d)/r*(s.tvm.begin?1+r:1))+s.tvm.fv*d;},Math.max(base,1),0,1e10)-.005);value=s.tvm.n; }
  else if(key==='i') value=root(r=>equation(s,s.tvm.n,r),s.tvm.i/100)*100;
  else {const c=tvmCoefficients(s); if(Math.abs(c[key])<1e-30)throw new Error('Error 5'); const sum=(['pv','pmt','fv'] as const).filter(k=>k!==key).reduce((a,k)=>a+s.tvm[k]*c[k],0);value=-sum/c[key];}
  s.tvm[key]=precision(value);if(s.mode==='RPN')lift(s);result(s,value,key.toUpperCase(),false);s.financialInputReady=false;
}
function stats(s:CalculatorState){const [n,sx,sxx,sy,syy,sxy]=s.registers.slice(1,7);if(n<=0)throw new Error('Error 2');return {n,sx,sxx,sy,syy,sxy};}
function statsPair(s:CalculatorState,a:number,b:number,label:string,last=true){ result(s,a,label,last);s.y=precision(b); }
function regression(s:CalculatorState){const q=stats(s);const dx=q.n*q.sxx-q.sx*q.sx,dy=q.n*q.syy-q.sy*q.sy;if(dx<=0||dy<0)throw new Error('Error 2');const cross=q.n*q.sxy-q.sx*q.sy;const slope=cross/dx;return {slope,intercept:(q.sy-slope*q.sx)/q.n,r:dy===0?0:cross/Math.sqrt(dx*dy),correlationUndefined:dy===0};}
export function parseDate(value:number,format:'MDY'|'DMY'='MDY'):Date {
  const [first,tail='']=Math.abs(value).toFixed(6).split('.'); const second=Number(tail.slice(0,2)),year=Number(tail.slice(2));
  const month=format==='MDY'?Number(first):second,day=format==='MDY'?second:Number(first);
  const d=new Date(0);d.setUTCFullYear(year,month-1,day);d.setUTCHours(0,0,0,0);
  if(value<0||d.getTime()<Date.UTC(1582,9,15)||d.getTime()>Date.UTC(4046,10,25)||d.getUTCMonth()!==month-1||d.getUTCDate()!==day)throw new Error('Error 8');return d;
}
function encodeDate(d:Date,format:'MDY'|'DMY') {const a=format==='MDY'?d.getUTCMonth()+1:d.getUTCDate(),b=format==='MDY'?d.getUTCDate():d.getUTCMonth()+1;return Number(`${a}.${String(b).padStart(2,'0')}${d.getUTCFullYear()}`);}
function days360(a:Date,b:Date){let d1=a.getUTCDate(),d2=b.getUTCDate();if(d1===31)d1=30;if(d2===31&&d1===30)d2=30;return (b.getUTCFullYear()-a.getUTCFullYear())*360+(b.getUTCMonth()-a.getUTCMonth())*30+d2-d1;}
function bondDates(s:CalculatorState){const settle=parseDate(s.y,s.dateFormat),maturity=parseDate(s.x,s.dateFormat);if(settle>=maturity||maturity.getUTCFullYear()-settle.getUTCFullYear()>500||s.tvm.pmt<0)throw new Error(s.tvm.pmt<0?'Error 5':'Error 8');const corresponding=new Date(maturity);corresponding.setUTCMonth(corresponding.getUTCMonth()-6);if(corresponding.getUTCDate()!==maturity.getUTCDate())throw new Error('Error 8');const dates=[maturity];let cursor=new Date(maturity);while(cursor>settle&&dates.length<1002){const day=maturity.getUTCDate();cursor=new Date(cursor);cursor.setUTCDate(1);cursor.setUTCMonth(cursor.getUTCMonth()-6);const last=new Date(Date.UTC(cursor.getUTCFullYear(),cursor.getUTCMonth()+1,0)).getUTCDate();cursor.setUTCDate(Math.min(day,last));dates.unshift(cursor);}const prior=dates.shift()!;const e=(dates[0].getTime()-prior.getTime())/86400000,a=(settle.getTime()-prior.getTime())/86400000;return {count:dates.length,a,e,d:(maturity.getTime()-settle.getTime())/86400000};}
function bondValue(yieldRate:number,coupon:number,q:ReturnType<typeof bondDates>){const c=coupon/2,r=yieldRate/200,accrued=c*q.a/q.e;if(q.count===1)return (100+c)/(1+q.d/q.e*r)-accrued;return Array.from({length:q.count},(_,k)=>c/Math.pow(1+r,k+1-q.a/q.e)).reduce((a,b)=>a+b,0)+100/Math.pow(1+r,q.count-q.a/q.e)-accrued;}
function finish(s:CalculatorState){s.x=precision(s.x);return s;}
function run(s:CalculatorState,oneStep=false):CalculatorState {
  s.programMode=false;s.running=true;s.paused=false;if(s.entering){s.entering=false;s.lift=true;}let budget=10000;
  while(s.pc<s.program.length&&budget-->0){ const instruction=s.program[s.pc++];
    if(instruction.startsWith('goto:')){const line=Number(instruction.slice(5));if(line>Math.max(8,s.program.length)){s.error='Error 4';s.running=false;break;}if(line===0){s.pc=0;s.running=false;break;}s.pc=line-1;}
    else if(instruction.startsWith('sequence:')){for(const action of instruction.slice(9).split(',')){s=pressAction(s,action,true);if(s.error)break;}}
    else if(instruction==='testLe'){if(!(s.x<=s.y))s.pc++;}
    else if(instruction==='testZero'){if(s.x!==0)s.pc++;}
    else if(instruction==='runStop'){s.running=false;break;}
    else if(instruction==='pause'){s.paused=true;s.running=false;s.displayLabel='PSE';break;}
    else s=pressAction(s,instruction,true);
    if(s.error||oneStep){s.running=false;break;}
  }
  if(s.pc>=s.program.length&&!s.paused){s.pc=0;s.running=false;}
  if(budget<=0){s.running=false;s.paused=true;s.displayLabel='PROGRAMA PAUSADO';}
  return s;
}
export function pressAction(previous:CalculatorState,action:string,executing=false):CalculatorState {
  let s=clone(previous);s.displayOverride=null;if(!executing)s.paused=false;
  if(!s.powered&&action!=='on')return s;
  if(action==='undo'){if(s.undoState)return {...clone({...s.undoState,undoState:null}),undoState:null};return s;}
  if(s.error){s.error=null;s.pendingRegister=null;s.storeOp=null;s.registerDot=false;s.pendingGoto=null;s.programPrefix=[];s.displayLabel='PRONTO';return s;}
  if(action==='shiftF'||action==='shiftG'){s.shift=action==='shiftF'?'f':'g';s.displayLabel=s.shift;return s;}
  if(action==='program'){s.programMode=!s.programMode;if(!s.programMode)s.pc=0;s.entering=false;s.programPrefix=[];s.pendingRegister=null;s.displayLabel=s.programMode?'PRGM':'RUN';return s;}
  if(action==='clearProgram'){if(s.programMode)s.program=[];s.programPrefix=[];s.pc=0;s.pendingGoto=null;return s;}
  if(s.pendingGoto!==null){if(action==='decimal'){s.gotoPosition=true;return s;}if(/^\d$/.test(action)){s.pendingGoto+=action;if(s.pendingGoto.length===3){const line=Number(s.pendingGoto);if((!s.programMode||s.gotoPosition)&&line>Math.max(8,s.program.length)){s.error='Error 4';s.pendingGoto=null;return s;}if(s.programMode&&!s.gotoPosition){if(s.pc>=400){s.error='Error 4';s.pendingGoto=null;return s;}s.program[s.pc++]=`goto:${line}`;}else s.pc=line;s.pendingGoto=null;s.gotoPosition=false;}return s;}s.pendingGoto=null;}
  if(action==='goto'){s.pendingGoto='';s.gotoPosition=false;return s;}
  if(s.programMode&&!executing){
    if(action==='step'){s.pc=(s.pc+1)%(Math.max(8,s.program.length)+1);return s;}
    if(action==='backStep'){s.pc=Math.max(0,s.pc-1);return s;}
    if(action==='store'||action==='recall'){s.programPrefix=[action];return s;}
    if(s.programPrefix.length&&!['shiftF','shiftG'].includes(action)){
      if(action==='decimal'||(s.programPrefix[0]==='store'&&['plus','minus','multiply','divide'].includes(action))){s.programPrefix.push(action);return s;}
      if(/^\d$/.test(action)||['n','i','pv','pmt','fv','cf0','cfj','nj','eex'].includes(action)){action=`sequence:${[...s.programPrefix,action].join(',')}`;}
      s.programPrefix=[];
    }
    if(['shiftF','shiftG','prefix','memory','on','off'].includes(action)){}else{if(s.pc>=400){s.error='Error 4';return s;}s.program[s.pc++]=action;s.displayLabel='PRGM';return s;}
  }
  if(!executing){if(['clx','backspace','clearStats','clearFin','clearReg'].includes(action)){const {undoState,...snapshot}=previous;s.undoState=structuredClone(snapshot);}else s.undoState=null;}
  try {
    if(s.pendingRegister) {
      if(action==='decimal'){s.registerDot=true;return s;}
      const financialKey=['n','i','pv','pmt','fv'].includes(action)?action as FinancialKey:null;
      if(['cf0','cfj','nj'].includes(action)) {
        const j=action==='cf0'?0:Math.floor(s.tvm.n);if(j<0||j>=s.cashflows.length)throw new Error('Error 6');
        if(s.pendingRegister==='recall'){recallValue(s,action==='nj'?s.cashflowCounts[j]:j<20?s.registers[j]:s.cashflows[j],action);if(action==='cfj')s.tvm.n=j-1;}
        else if(action==='nj'){if(j===0||s.x<0||s.x>99||Math.floor(s.x)!==s.x)throw new Error('Error 6');s.cashflowCounts[j]=s.x;}
        else{s.cashflows[j]=s.x;if(j<20)s.registers[j]=s.x;}
        s.pendingRegister=null;s.registerDot=false;s.storeOp=null;return s;
      }
      if(/^\d$/.test(action)||financialKey||['cf0','cfj','nj'].includes(action)){
        const idx=Number(action)+(s.registerDot?10:0);if(s.storeOp&&(financialKey||idx>4))throw new Error('Error 4');const value=financialKey?s.tvm[financialKey]:action==='cf0'?s.cashflows[0]:action==='cfj'?s.cashflows[Math.min(Math.floor(s.tvm.n),s.cashflows.length-1)]:action==='nj'?s.cashflowCounts[Math.min(Math.floor(s.tvm.n),s.cashflows.length-1)]:s.registers[idx];
        if(s.pendingRegister==='recall')recallValue(s,value,financialKey?.toUpperCase()||`R${idx}`);
        else {const value=s.storeOp?valueOp(financialKey?s.tvm[financialKey]:s.registers[idx],s.x,s.storeOp):s.x;if(Math.abs(value)>9.999999999e99)throw new Error('Error 1');if(financialKey)s.tvm[financialKey]=precision(value);else{s.registers[idx]=precision(value);if(idx<s.cashflows.length)s.cashflows[idx]=s.registers[idx];}s.entering=false;s.lift=true;}
        s.pendingRegister=null;s.storeOp=null;s.registerDot=false;return s;
      }
      if(s.pendingRegister==='store'&&['plus','minus','multiply','divide'].includes(action)){s.storeOp=({plus:'+',minus:'-',multiply:'*',divide:'/'} as Record<string,string>)[action];return s;}
      if(s.pendingRegister==='store'&&action==='eex'){s.compoundOdd=!s.compoundOdd;s.pendingRegister=null;return s;}
      s.pendingRegister=null;
    }
    if(/^\d$/.test(action)||action==='decimal') {
      if(!s.entering){if(s.lift&&s.mode==='RPN')lift(s);else if(s.mode==='ALG'&&!s.pendingOp)s.y=s.x;s.input=action==='decimal'?'0.':action;s.entering=true;}
      else if(action==='decimal'){if(!s.input.includes('.')&&!s.input.includes('e'))s.input+='.';}
      else if(s.input.includes('e')) {const [m,e]=s.input.split('e');const negative=e.startsWith('-');const digits=e.replace('-','');s.input=`${m}e${negative?'-':''}${digits==='0'?action:(digits+action).slice(-2)}`;}
      else if(s.input.replace(/[-.]/g,'').length<10){s.input=(s.input==='0'?'':s.input==='-0'?'-':s.input)+action;}
      s.x=precision(Number(s.input));s.lift=true;s.financialInputReady=true;s.displayLabel='ENTRADA';return s;
    }
    if(/^fixed\d$/.test(action)){s.decimals=Number(action.slice(-1));s.fixed=true;s.entering=false;s.displayLabel=`FIX ${s.decimals}`;return s;}
    switch(action) {
      case 'shiftF':s.shift='f';s.displayLabel='f';return s;
      case 'shiftG':s.shift='g';s.displayLabel='g';return s;
      case 'on':s.powered=!s.powered;s.shift=null;return s;
      case 'off':s.powered=false;return s;
      case 'chs':if(s.entering&&s.input.includes('e')){s.input=s.input.includes('e-')?s.input.replace('e-','e'):s.input.replace('e','e-');s.x=precision(Number(s.input));}else if(s.entering){s.input=s.input.startsWith('-')?s.input.slice(1):'-'+s.input;s.x=precision(Number(s.input));}else result(s,-s.x,undefined,false);return s;
      case 'eex':if(!s.entering){if(s.x===0)s.x=1;s.input=String(s.x);s.entering=true;}if(!s.input.includes('e'))s.input+='e0';s.financialInputReady=true;return s;
      case 'backspace':if(s.entering){s.input=s.input.slice(0,-1);if(s.input.endsWith('e')||s.input.endsWith('e-'))s.input=s.input.split('e')[0];if(!s.input||s.input==='-')s.input='0';s.x=precision(Number(s.input));}else{s.x=0;s.input='0';s.lift=false;}return s;
      case 'enter':case 'equals':if(s.mode==='ALG'){algEquals(s);}else{lift(s);s.entering=false;s.lift=false;}return s;
      case 'plus':case 'minus':case 'multiply':case 'divide':case 'pow':{const op=({plus:'+',minus:'-',multiply:'*',divide:'/',pow:'^'} as Record<string,string>)[action];if(s.mode==='ALG')algPush(s,op);else binary(s,op);return finish(s);}
      case 'parenOpen':if(s.mode==='ALG'){if(s.algOperators.filter(op=>op==='(').length>=13)throw new Error('Error 4');s.pendingOp=null;s.algOperators.push('(');s.entering=false;s.lift=false;}return s;
      case 'parenClose':if(s.mode==='ALG'){s.algOperands.push(s.x);while(s.algOperators.length&&s.algOperators.at(-1)!=='(')algReduce(s);if(s.algOperators.pop()!=='(')throw new Error('Error 0');result(s,s.algOperands.pop()??s.x);s.pendingOp=null;}return s;
      case 'clx':if(s.mode==='ALG'&&previous.displayLabel==='CLX'){s.algOperands=[];s.algOperators=[];s.pendingOp=null;}s.displayLabel='CLX';s.x=0;s.input='0';s.entering=false;s.lift=false;s.financialInputReady=true;return s;
      case 'roll':{const x=s.x;s.x=s.y;s.y=s.z;s.z=s.t;s.t=x;s.entering=false;s.lift=true;return s;}
      case 'swap':if(s.correlationUndefined)throw new Error('Error 2');[s.x,s.y]=[s.y,s.x];s.entering=false;s.lift=true;return s;
      case 'store':s.pendingRegister='store';s.registerDot=false;s.displayLabel='STO';return s;
      case 'recall':s.pendingRegister='recall';s.registerDot=false;s.displayLabel='RCL';return s;
      case 'lastX':recallValue(s,s.lastX,'LST x');return s;
      case 'toggleSeparator':s.decimalComma=!s.decimalComma;s.powered=true;return s;
      case 'modeRpn':case 'modeAlg':s.mode=action==='modeRpn'?'RPN':'ALG';s.algOperands=[];s.algOperators=[];s.pendingOp=null;s.entering=false;return s;
      case 'begin':s.entering=false;s.tvm.begin=true;return s;
      case 'end':s.entering=false;s.tvm.begin=false;return s;
      case 'n':case 'i':case 'pv':case 'pmt':case 'fv':financial(s,action);return s;
      case '12x':result(s,s.x*12,'n');s.tvm.n=s.x;s.financialInputReady=false;return s;
      case '12div':result(s,s.x/12,'i');s.tvm.i=s.x;s.financialInputReady=false;return s;
      case 'clearFin':s.tvm={n:0,i:0,pv:0,pmt:0,fv:0,begin:s.tvm.begin};s.financialInputReady=false;return s;
      case 'clearStats':for(let k=1;k<=6;k++)s.registers[k]=0;s.x=s.y=s.z=s.t=0;s.input="0";s.entering=false;s.financialInputReady=false;s.lift=false;return s;
      case 'clearReg':s.registers=Array(20).fill(0);s.cashflows=[0];s.cashflowCounts=[1];s.tvm={n:0,i:0,pv:0,pmt:0,fv:0,begin:s.tvm.begin};s.lastX=0;s.x=s.y=s.z=s.t=0;s.input="0";s.entering=false;s.financialInputReady=false;s.lift=false;return s;
      case 'amortize':{const count=s.x;if(!Number.isInteger(count)||count<=0||s.tvm.i<=-100)throw new Error('Error 5');const round=(n:number)=>Number(n.toFixed(s.decimals));let balance=round(s.tvm.pv),interest=0,principal=0;for(let k=0;k<count;k++){const it=(s.tvm.begin&&s.tvm.n===0&&k===0)?0:round(-balance*s.tvm.i/100);const pr=round(s.tvm.pmt)-it;interest+=it;principal+=pr;balance+=pr;}s.tvm.pv=precision(balance);s.tvm.n+=count;s.t=s.y;result(s,interest,'AMORT',false);s.y=precision(principal);s.z=count;return s;}
      case 'interest':{s.t=s.x;const i=-s.tvm.pv*s.tvm.i*s.tvm.n/36000;result(s,i,'INT 360',false);s.y=-s.tvm.pv;s.z=precision(-s.tvm.pv*s.tvm.i*s.tvm.n/36500);return s;}
      case 'cf0':s.cashflows=[s.x];s.cashflowCounts=[1];s.registers[0]=s.x;s.tvm.n=0;s.entering=false;s.lift=true;return s;
      case 'cfj':{if(!Number.isInteger(s.tvm.n))throw new Error('Error 6');const j=s.tvm.n+1;if(j<1||j>80||j>s.cashflows.length)throw new Error('Error 6');s.cashflows[j]=s.x;s.cashflowCounts[j]=1;s.tvm.n=j;if(j<20)s.registers[j]=s.x;s.entering=false;s.lift=true;return s;}
      case 'nj':{const j=s.tvm.n;if(s.x<0||s.x>99||!Number.isInteger(s.x)||!Number.isInteger(j)||j<=0||j>=s.cashflows.length)throw new Error('Error 6');s.cashflowCounts[j]=s.x;s.entering=false;s.lift=true;return s;}
      case 'npv':case 'irr':{const count=s.tvm.n;if(!Number.isInteger(count)||count<0||count>80||count>=s.cashflows.length)throw new Error('Error 6');const fn=(r:number)=>{let total=s.registers[0],period=0;for(let j=1;j<=count;j++)for(let k=0;k<s.cashflowCounts[j];k++)total+=(j<20?s.registers[j]:s.cashflows[j])/Math.pow(1+r,++period);return total;};if(s.tvm.i<=-100)throw new Error('Error 5');const flows=[s.registers[0],...Array.from({length:count},(_,k)=>k+1<20?s.registers[k+1]:s.cashflows[k+1]).filter((_,k)=>s.cashflowCounts[k+1]>0)];if(action==='irr'&&(!flows.some(v=>v>0)||!flows.some(v=>v<0)))throw new Error('Error 7');let value:number;if(action==='npv')value=fn(s.tvm.i/100);else{try{value=root(fn,s.tvm.i/100)*100;}catch(error){throw new Error(error instanceof Error&&error.message==='Error 5'?'Error 7':'Error 3');}}if(s.mode==='RPN')lift(s);result(s,value,action.toUpperCase(),false);if(action==='irr')s.tvm.i=s.x;return s;}
      case 'bondPrice':case 'bondYield':{const dates=bondDates(s);if(action==='bondPrice'){const price=bondValue(s.tvm.i,s.tvm.pmt,dates);if(s.mode==='RPN'){s.t=s.y;s.z=s.x;}result(s,price,'PRICE',false);s.tvm.pv=s.x;s.y=precision(s.tvm.pmt/2*dates.a/dates.e);}else{const yieldValue=root(r=>bondValue(r*100,s.tvm.pmt,dates)-s.tvm.pv,s.tvm.i/100,-1.999,100)*100;if(s.mode==='RPN')lift(s);result(s,yieldValue,'YTM',false);s.tvm.i=s.x;}s.tvm.fv=100+s.tvm.pmt/2;s.tvm.n=1-dates.a/dates.e;return s;}
      case 'deprSL':case 'deprSOYD':case 'deprDB':{const year=Math.trunc(s.x),n=s.tvm.n,cost=s.tvm.pv,salvage=s.tvm.fv;if(!Number.isInteger(s.x)||year<1||n<=0||cost<salvage)throw new Error('Error 5');let depreciation=0,book=cost;const whole=Math.floor(n),fraction=n-whole,soyd=(whole+1)*(whole+2*fraction)/2;for(let k=1;k<=year;k++){depreciation=k>n?0:action==='deprSL'?(cost-salvage)/n:action==='deprSOYD'?(cost-salvage)*(n-k+1)/soyd:Math.min(Math.max(0,book-salvage),book*s.tvm.i/100/n);book-=depreciation;}if(s.mode==='RPN'){s.t=s.y;s.z=s.x;}result(s,depreciation,action.slice(4),false);s.y=precision(book-salvage);return s;}
      case 'sigmaPlus':case 'sigmaMinus':{const sign=action==='sigmaPlus'?1:-1,x=s.x,y=s.y;const entries=[1,x,x*x,y,y*y,x*y];entries.forEach((v,k)=>{const sum=s.registers[k+1]+sign*v;if(Math.abs(sum)>9.999999999e99)throw new Error('Error 1');s.registers[k+1]=precision(sum);});result(s,s.registers[1],'n');s.lift=false;return s;}
      case 'mean':{const q=stats(s);statsPair(s,q.sx/q.n,q.sy/q.n,'x̄',false);return s;}
      case 'stddev':{const q=stats(s);if(q.n<=1||q.n*q.sxx-q.sx*q.sx<0||q.n*q.syy-q.sy*q.sy<0)throw new Error('Error 2');statsPair(s,Math.sqrt(Math.max(0,(q.sxx-q.sx*q.sx/q.n)/(q.n-1))),Math.sqrt(Math.max(0,(q.syy-q.sy*q.sy/q.n)/(q.n-1))),'s',false);return s;}
      case 'weightedMean':{const q=stats(s);if(q.sx===0)throw new Error('Error 2');result(s,q.sxy/q.sx,'x̄w',false);return s;}
      case 'estimateX':case 'estimateY':{const q=regression(s);if(action==='estimateX'&&q.slope===0)throw new Error('Error 2');statsPair(s,action==='estimateY'?q.intercept+q.slope*s.x:(s.x-q.intercept)/q.slope,q.r,action==='estimateY'?'ŷ,r':'x̂,r');s.correlationUndefined=q.correlationUndefined;return s;}
      case 'reciprocal':if(s.x===0)throw new Error('Error 0');result(s,1/s.x);return s;
      case 'sin':case 'cos':case 'tan':{
        const angle=s.angular==='DEG' ? (s.x%360)*Math.PI/180 : s.x;
        // Tangent is undefined at odd multiples of a right angle.
        if(action==='tan'&&Math.abs(Math.cos(angle))<1e-14)throw new Error('Error 0');
        const value=action==='sin'?Math.sin(angle):action==='cos'?Math.cos(angle):Math.tan(angle);
        if(!Number.isFinite(value))throw new Error('Error 0');
        result(s,Math.abs(value)<1e-14?0:value,`${action.toUpperCase()} ${s.angular}`);return s;
      }
      case 'sqrt':result(s,Math.sqrt(s.x));return s;
      case 'ln':if(s.x<=0)throw new Error('Error 0');result(s,Math.log(s.x));return s;
      case 'exp':result(s,Math.exp(s.x));return s;
      case 'square':result(s,s.x*s.x);return s;
      case 'intg':result(s,Math.trunc(s.x));return s;
      case 'frac':result(s,s.x-Math.trunc(s.x));return s;
      case 'factorial':{if(s.x<0||Math.trunc(s.x)!==s.x)throw new Error('Error 0');if(s.x>=70){result(s,9.999999999e99);return s;}let value=1;for(let k=2;k<=s.x;k++)value*=k;result(s,value);return s;}
      case 'pct':result(s,(s.mode==='ALG' ? (['+','-'].includes(s.pendingOp||'') ? s.algOperands.at(-1)??s.y : 1) : s.y)*s.x/100,'%');return s;
      case 'pctT':{const base=s.mode==='ALG'?(s.algOperands.at(-1)??s.y):s.y;if(base===0)throw new Error('Error 0');result(s,s.x/base*100,'%T');return s;}
      case 'deltaPct':{const base=s.mode==='ALG'?(s.algOperands.at(-1)??s.y):s.y;if(base===0)throw new Error('Error 0');result(s,(s.x-base)/base*100,'Δ%');return s;}
      case 'round':result(s,s.fixed?Number(s.x.toFixed(s.decimals)):Number(s.x.toPrecision(7)),'RND');return s;
      case 'scientific':s.fixed=false;s.entering=false;return s;
      case 'mdy':s.entering=false;s.dateFormat='MDY';return s;
      case 'dmy':s.entering=false;s.dateFormat='DMY';return s;
      case 'date':{const date=parseDate(s.y,s.dateFormat);date.setUTCDate(date.getUTCDate()+Math.trunc(s.x));if(date.getTime()<Date.UTC(1582,9,15)||date.getTime()>Date.UTC(4046,10,25))throw new Error('Error 8');result(s,encodeDate(date,s.dateFormat),'DATE');drop(s);s.displayOverride=`${s.x.toFixed(6)} ${date.getUTCDay()||7}`;return s;}
      case 'days':{const a=parseDate(s.y,s.dateFormat),b=parseDate(s.x,s.dateFormat);result(s,(b.getTime()-a.getTime())/86400000,'ΔDYS');s.y=days360(a,b);return s;}
      case 'runStop':return run(s);
      case 'step':return run(s,true);
      case 'backStep':s.pc=Math.max(0,s.pc-1);s.displayLabel=`STEP ${s.pc}`;return s;
      case 'pause':s.paused=true;return s;
      case 'testZero':s.displayLabel=s.x===0?'VERDADEIRO':'FALSO';return s;
      case 'testLe':s.displayLabel=s.x<=s.y?'VERDADEIRO':'FALSO';return s;
      case 'prefix':s.shift=null;s.pendingRegister=null;s.pendingGoto=null;s.programPrefix=[];s.displayLabel='MANTISSA';s.displayOverride=Math.abs(s.x).toExponential(9).split('e')[0].replace('.','');return s;
      case 'memory':s.displayOverride=`P${String(Math.max(8,s.program.length)).padStart(3,'0')} r20`;return s;
      case 'toggleAngular':s.angular=s.angular==='DEG'?'RAD':'DEG';return s;
      default:throw new Error(`Função desconhecida: ${action}`);
    }
  } catch(error){const errorText=error instanceof Error?error.message:'Error 0';return {...clone(previous),error:errorText,displayLabel:errorText,running:false,shift:null};}
}
export function pressKey(previous:CalculatorState,id:string):CalculatorState {
  if(id==='f'||id==='g')return pressAction(previous,id==='f'?'shiftF':'shiftG');
  const action=resolveKeyAction(id,previous.shift);const next=pressAction(previous,action);next.shift=null;return next;
}
const displayFormatters=new Map<string,Intl.NumberFormat>();
function fixedDisplay(value:number,comma:boolean,digits:number):string {
  const key=`${comma}:${digits}`;
  let formatter=displayFormatters.get(key);
  if(!formatter){formatter=new Intl.NumberFormat(comma?'pt-BR':'en-US',{minimumFractionDigits:digits,maximumFractionDigits:digits,useGrouping:true});displayFormatters.set(key,formatter);}
  return formatter.format(value);
}
export function formatDisplay(s:CalculatorState):string {
  if(!s.powered)return '';if(s.error)return s.error;if(s.displayOverride)return s.displayOverride;
  if(s.programMode)return `${String(s.pc).padStart(3,'0')}, ${s.pc?programCode(s.program[s.pc-1]||'goto:000'):''}`;
  // Group only the integer part: preserve typed zeros, trailing decimal and exponent.
  if(s.entering){const [mantissa,exponent]=s.input.split('e'),[whole,fraction]=mantissa.split('.');return whole.replace(/\B(?=(\d{3})+(?!\d))/g,s.decimalComma?'.':',')+(fraction!==undefined?(s.decimalComma?',':'.')+fraction:'')+(exponent!==undefined?' E'+exponent:'');}
  // Preserve the previous extended format for callers that explicitly use it.
  if(s.fixed && s.decimals===12) {
    return fixedDisplay(s.x,s.decimalComma,12);
  }
  if(!s.fixed||Math.abs(s.x)>=1e10||(s.x!==0&&Math.abs(s.x)<1e-9))return scientificDisplay(s.x,s.decimalComma);
  const whole=Math.max(1,Math.floor(Math.log10(Math.abs(s.x)||1))+1),digits=Math.max(0,Math.min(s.decimals,10-whole));
  return fixedDisplay(s.x,s.decimalComma,digits);
}
function scientificDisplay(value:number,comma:boolean):string {const [mantissa,exponent]=(Math.abs(value)>=9.9999995e99?`${value<0?'-':''}9.999999e+99`:value.toExponential(6)).split('e');const exp=Number(exponent);return `${comma?mantissa.replace('.',','):mantissa} ${exp<0?'-':''}${String(Math.abs(exp)).padStart(2,'0')}`;}
function programCode(action:string):string {
  if(action.startsWith('goto:'))return `43,33,${action.slice(5).padStart(3,'0')}`;
  if(action.startsWith('sequence:'))return action.slice(9).split(',').map(programCode).join(' ');
  if(/^\d$/.test(action))return action;
  for(const key of Object.values(KEY_BY_ID)){
    const code=/^\d$/.test(key.action)?key.action:`${key.row+1}${(key.col+1)%10}`;
    if(key.action===action)return code;
    if(key.fAction===action)return `42 ${code}`;
    if(key.gAction===action)return `43 ${code}`;
  }
  return action;
}
export function restoreState(value:unknown):CalculatorState {
  if(!value||typeof value!=='object'||(value as CalculatorState).schemaVersion!==2)return clone(INITIAL_STATE);
  const s=value as CalculatorState;if(!Array.isArray(s.registers)||s.registers.length!==20||!Number.isFinite(s.x))return clone(INITIAL_STATE);
  return {...clone(INITIAL_STATE),...structuredClone(s),running:false,paused:false,undoState:null};
}

