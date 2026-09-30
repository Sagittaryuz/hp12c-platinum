import { KEY_BY_ID, resolveKeyAction, type Shift } from './keys';

export type CalcMode = 'RPN' | 'ALG';
type FinancialKey = 'n'|'i'|'pv'|'pmt'|'fv';
type Tvm = { n:number; i:number; pv:number; pmt:number; fv:number; begin:boolean };
export type CalculatorState = {
  schemaVersion:2; x:number; y:number; z:number; t:number; lastX:number; input:string; entering:boolean; lift:boolean;
  financialInputReady:boolean; shift:Shift; mode:CalcMode; error:string|null; decimals:number; fixed:boolean; powered:boolean;
  registers:number[]; tvm:Tvm; cashflows:number[]; cashflowCounts:number[]; compoundOdd:boolean;
  pendingRegister:'store'|'recall'|null; registerDot:boolean; storeOp:string|null; pendingGoto:string|null; gotoPosition:boolean;
  pendingOp:string|null; algOperands:number[]; algOperators:string[]; programMode:boolean; program:string[]; pc:number;
  paused:boolean; running:boolean; angular:'DEG'|'RAD'; dateFormat:'MDY'|'DMY'; displayLabel:string; displayOverride:string|null;
  undoState:Omit<CalculatorState,'undoState'>|null;
};
export const INITIAL_STATE:CalculatorState = {
  schemaVersion:2,x:0,y:0,z:0,t:0,lastX:0,input:'0',entering:false,lift:false,financialInputReady:false,shift:null,mode:'RPN',
  error:null,decimals:2,fixed:true,powered:true,registers:Array(20).fill(0),tvm:{n:0,i:0,pv:0,pmt:0,fv:0,begin:false},
  cashflows:[0],cashflowCounts:[1],compoundOdd:false,pendingRegister:null,registerDot:false,storeOp:null,pendingGoto:null,
  gotoPosition:false,pendingOp:null,algOperands:[],algOperators:[],programMode:false,program:[],pc:0,paused:false,running:false,
  angular:'DEG',dateFormat:'MDY',displayLabel:'PRONTO',displayOverride:null,undoState:null,
};
const clone = (s:CalculatorState):CalculatorState => structuredClone(s);
const precision = (n:number):number => {
  if (!Number.isFinite(n)) throw new Error('Error 0');
  if (Math.abs(n)>9.999999999e99) throw new Error('Error 1');
  return Math.abs(n)<1e-99 ? 0 : Number(n.toPrecision(10));
};
function lift(s:CalculatorState) { s.t=s.z; s.z=s.y; s.y=s.x; }
function result(s:CalculatorState,n:number,label?:string,last=true) {
  if(last) s.lastX=s.x;
  s.x=precision(n); s.input=String(s.x); s.entering=false; s.lift=true; s.financialInputReady=true;
  s.displayLabel=label || 'RESULTADO';
}
function recallValue(s:CalculatorState,n:number,label:string) { if(s.lift && s.mode==='RPN') lift(s); result(s,n,label,false); }
function drop(s:CalculatorState) { s.y=s.z; s.z=s.t; }
function valueOp(a:number,b:number,op:string) { return op==='+'?a+b:op==='-'?a-b:op==='*'?a*b:op==='/'?a/b:Math.pow(a,b); }
function binary(s:CalculatorState,op:string) { result(s,valueOp(s.y,s.x,op)); drop(s); }
function algReduce(s:CalculatorState) {
  const op=s.algOperators.pop(); if(!op || op==='(') return;
  const b=s.algOperands.pop(), a=s.algOperands.pop(); if(a===undefined || b===undefined) throw new Error('Error 0');
  s.algOperands.push(precision(valueOp(a,b,op)));
}
const priority = (op:string)=>op==='^'?3:['*','/'].includes(op)?2:1;
function algPush(s:CalculatorState,op:string) {
  s.algOperands.push(s.x);
  while(s.algOperators.length && s.algOperators.at(-1)!=='(' && priority(s.algOperators.at(-1)!)>=priority(op)) algReduce(s);
  s.algOperators.push(op); s.x=s.algOperands.at(-1)!; s.pendingOp=op; s.entering=false; s.lift=false;
}
function algEquals(s:CalculatorState) {
  if(s.algOperators.length) { s.algOperands.push(s.x); while(s.algOperators.length) algReduce(s); result(s,s.algOperands.pop() ?? s.x); }
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
  let value:number;
  if(key==='n') { const base=s.tvm.n; s.tvm.n=Math.ceil(root(n=>{const r=s.tvm.i/100,d=Math.pow(1+r,-n);return s.tvm.pv+s.tvm.pmt*(Math.abs(r)<1e-12?n:(1-d)/r*(s.tvm.begin?1+r:1))+s.tvm.fv*d;},Math.max(base,1),0,1e6)-1e-8);value=s.tvm.n; }
  else if(key==='i') value=root(r=>equation(s,s.tvm.n,r),s.tvm.i/100)*100;
  else {const c=tvmCoefficients(s); if(Math.abs(c[key])<1e-30)throw new Error('Error 5'); const sum=(['pv','pmt','fv'] as const).filter(k=>k!==key).reduce((a,k)=>a+s.tvm[k]*c[k],0);value=-sum/c[key];}
  s.tvm[key]=precision(value);result(s,value,key.toUpperCase());s.financialInputReady=false;
}
function stats(s:CalculatorState){const [n,sx,sxx,sy,syy,sxy]=s.registers.slice(1,7);if(n<=0)throw new Error('Error 2');return {n,sx,sxx,sy,syy,sxy};}
function statsPair(s:CalculatorState,a:number,b:number,label:string){ result(s,a,label);s.y=precision(b); }
function regression(s:CalculatorState){const q=stats(s);const dx=q.n*q.sxx-q.sx*q.sx,dy=q.n*q.syy-q.sy*q.sy;if(dx<=0||dy<=0)throw new Error('Error 2');const cross=q.n*q.sxy-q.sx*q.sy;const slope=cross/dx;return {slope,intercept:(q.sy-slope*q.sx)/q.n,r:cross/Math.sqrt(dx*dy)};}
export function parseDate(value:number,format:'MDY'|'DMY'='MDY'):Date {
  const [first,tail='']=Math.abs(value).toFixed(6).split('.'); const second=Number(tail.slice(0,2)),year=Number(tail.slice(2));
  const month=format==='MDY'?Number(first):second,day=format==='MDY'?second:Number(first);
  const d=new Date(0);d.setUTCFullYear(year,month-1,day);d.setUTCHours(0,0,0,0);
  if(year<1582||year>4046||d.getUTCMonth()!==month-1||d.getUTCDate()!==day)throw new Error('Error 8');return d;
}
function encodeDate(d:Date,format:'MDY'|'DMY') {const a=format==='MDY'?d.getUTCMonth()+1:d.getUTCDate(),b=format==='MDY'?d.getUTCDate():d.getUTCMonth()+1;return Number(`${a}.${String(b).padStart(2,'0')}${d.getUTCFullYear()}`);}
function days360(a:Date,b:Date){let d1=a.getUTCDate(),d2=b.getUTCDate();if(d1===31)d1=30;if(d2===31&&d1===30)d2=30;return (b.getUTCFullYear()-a.getUTCFullYear())*360+(b.getUTCMonth()-a.getUTCMonth())*30+d2-d1;}
function bondDates(s:CalculatorState){const settle=parseDate(s.y,s.dateFormat),maturity=parseDate(s.x,s.dateFormat);if(settle>=maturity)throw new Error('Error 8');const dates=[maturity];let cursor=new Date(maturity);while(cursor>settle&&dates.length<300){const day=maturity.getUTCDate();cursor=new Date(cursor);cursor.setUTCDate(1);cursor.setUTCMonth(cursor.getUTCMonth()-6);const last=new Date(Date.UTC(cursor.getUTCFullYear(),cursor.getUTCMonth()+1,0)).getUTCDate();cursor.setUTCDate(Math.min(day,last));dates.unshift(cursor);}const prior=dates.shift()!;const e=(dates[0].getTime()-prior.getTime())/86400000,a=(settle.getTime()-prior.getTime())/86400000;return {count:dates.length,a,e,d:(maturity.getTime()-settle.getTime())/86400000};}
function bondValue(yieldRate:number,coupon:number,q:ReturnType<typeof bondDates>){const c=coupon/2,r=yieldRate/200,accrued=c*q.a/q.e;if(q.count===1)return (100+c)/(1+q.d/q.e*r)-accrued;return Array.from({length:q.count},(_,k)=>c/Math.pow(1+r,k+1-q.a/q.e)).reduce((a,b)=>a+b,0)+100/Math.pow(1+r,q.count-q.a/q.e)-accrued;}
function finish(s:CalculatorState){s.x=precision(s.x);return s;}
function run(s:CalculatorState,oneStep=false):CalculatorState {
  s.programMode=false;s.running=true;s.paused=false;if(s.entering){s.entering=false;s.lift=true;}let budget=10000;
  while(s.pc<s.program.length&&budget-->0){ const instruction=s.program[s.pc++];
    if(instruction.startsWith('goto:')){const line=Number(instruction.slice(5));if(line===0){s.pc=0;s.running=false;break;}s.pc=line-1;}
    else if(instruction==='testLe'){if(!(s.x<=s.y))s.pc++;}
    else if(instruction==='testZero'){if(s.x!==0)s.pc++;}
    else if(instruction==='runStop'){s.running=false;break;}
    else if(instruction==='pause'){s.paused=true;s.running=false;s.displayLabel='PSE';break;}
    else s=pressAction(s,instruction,true);
    if(s.error||oneStep){s.running=false;break;}
  }
  if(s.pc>=s.program.length){s.pc=0;s.running=false;}
  if(budget<=0){s.running=false;s.paused=true;s.displayLabel='PROGRAMA PAUSADO';}
  return s;
}
export function pressAction(previous:CalculatorState,action:string,executing=false):CalculatorState {
  let s=clone(previous);s.displayOverride=null;
  if(!s.powered&&action!=='on')return s;
  if(action==='undo'){if(s.undoState)return {...clone({...s.undoState,undoState:null}),undoState:null};return s;}
  if(s.error){s.error=null;s.displayLabel='PRONTO';return s;}
  if(action==='program'){s.programMode=!s.programMode;s.pc=0;s.entering=false;s.displayLabel=s.programMode?'PRGM':'RUN';return s;}
  if(action==='clearProgram'){if(s.programMode)s.program=[];s.pc=0;s.pendingGoto=null;return s;}
  if(s.pendingGoto!==null){if(action==='decimal'){s.gotoPosition=true;return s;}if(/^\d$/.test(action)){s.pendingGoto+=action;if(s.pendingGoto.length===3){const line=Number(s.pendingGoto);if((!s.programMode||s.gotoPosition)&&line>s.program.length){s.error='Error 4';s.pendingGoto=null;return s;}if(s.programMode&&!s.gotoPosition){s.program.splice(s.pc++,0,`goto:${line}`);}else s.pc=line;s.pendingGoto=null;s.gotoPosition=false;}return s;}s.pendingGoto=null;}
  if(action==='goto'){s.pendingGoto='';s.gotoPosition=false;return s;}
  if(s.programMode&&!executing){if(action==='step'){s.pc=Math.min(s.program.length,s.pc+1);return s;}if(action==='backStep'){s.pc=Math.max(0,s.pc-1);return s;}if(['shiftF','shiftG','prefix','memory','on','off'].includes(action)){}else{if(s.program.length>=400){s.error='Error 4';return s;}s.program.splice(s.pc++,0,action);s.displayLabel='PRGM';return s;}}
  if(!executing&&!['shiftF','shiftG','store','recall','prefix','undo'].includes(action)){const {undoState,...snapshot}=previous;s.undoState=structuredClone(snapshot);}
  try {
    if(s.pendingRegister) {
      if(action==='decimal'){s.registerDot=true;return s;}
      const financialKey=['n','i','pv','pmt','fv'].includes(action)?action as FinancialKey:null;
      if(['cf0','cfj','nj'].includes(action)) {
        const j=action==='cf0'?0:Math.floor(s.tvm.n);if(j<0||j>=s.cashflows.length)throw new Error('Error 6');
        if(s.pendingRegister==='recall'){recallValue(s,action==='nj'?s.cashflowCounts[j]:j<20?s.registers[j]:s.cashflows[j],action);if(action==='cfj')s.tvm.n=j-1;}
        else if(action==='nj'){if(s.x<1||s.x>99||Math.floor(s.x)!==s.x)throw new Error('Error 6');s.cashflowCounts[j]=s.x;}
        else{s.cashflows[j]=s.x;if(j<20)s.registers[j]=s.x;}
        s.pendingRegister=null;s.registerDot=false;s.storeOp=null;return s;
      }
      if(/^\d$/.test(action)||financialKey||['cf0','cfj','nj'].includes(action)){
        const idx=Number(action)+(s.registerDot?10:0);const value=financialKey?s.tvm[financialKey]:action==='cf0'?s.cashflows[0]:action==='cfj'?s.cashflows[Math.min(Math.floor(s.tvm.n),s.cashflows.length-1)]:action==='nj'?s.cashflowCounts[Math.min(Math.floor(s.tvm.n),s.cashflows.length-1)]:s.registers[idx];
        if(s.pendingRegister==='recall')recallValue(s,value,financialKey?.toUpperCase()||`R${idx}`);
        else {const value=s.storeOp?valueOp(financialKey?s.tvm[financialKey]:s.registers[idx],s.x,s.storeOp):s.x;if(financialKey)s.tvm[financialKey]=precision(value);else{s.registers[idx]=precision(value);if(idx<s.cashflows.length)s.cashflows[idx]=s.registers[idx];}s.entering=false;s.lift=true;}
        s.pendingRegister=null;s.storeOp=null;s.registerDot=false;return s;
      }
      if(s.pendingRegister==='store'&&['plus','minus','multiply','divide'].includes(action)){s.storeOp=({plus:'+',minus:'-',multiply:'*',divide:'/'} as Record<string,string>)[action];return s;}
      if(s.pendingRegister==='store'&&action==='eex'){s.compoundOdd=!s.compoundOdd;s.pendingRegister=null;return s;}
      s.pendingRegister=null;
    }
    if(/^\d$/.test(action)||action==='decimal') {
      if(!s.entering){if(s.lift&&s.mode==='RPN')lift(s);s.input=action==='decimal'?'0.':action;s.entering=true;}
      else if(action==='decimal'){if(!s.input.includes('.')&&!s.input.includes('e'))s.input+='.';}
      else if(s.input.includes('e')) {const [m,e]=s.input.split('e');const negative=e.startsWith('-');const digits=e.replace('-','');s.input=`${m}e${negative?'-':''}${digits==='0'?action:(digits+action).slice(-2)}`;}
      else if(s.input.replace(/[-.]/g,'').length<10){s.input=(s.input==='0'?'':s.input)+action;}
      s.x=precision(Number(s.input));s.lift=true;s.financialInputReady=true;s.displayLabel='ENTRADA';return s;
    }
    if(/^fixed\d$/.test(action)){s.decimals=Number(action.slice(-1));s.fixed=true;s.entering=false;s.displayLabel=`FIX ${s.decimals}`;return s;}
    switch(action) {
      case 'shiftF':s.shift='f';s.displayLabel='f';return s;
      case 'shiftG':s.shift='g';s.displayLabel='g';return s;
      case 'on':s.powered=!s.powered;s.shift=null;return s;
      case 'off':s.powered=false;return s;
      case 'chs':if(s.entering&&s.input.includes('e')){s.input=s.input.includes('e-')?s.input.replace('e-','e'):s.input.replace('e','e-');s.x=precision(Number(s.input));}else{const isEntry=s.entering;result(s,-s.x);s.entering=isEntry;s.input=String(s.x);}return s;
      case 'eex':if(!s.entering){if(s.x===0)s.x=1;s.input=String(s.x);s.entering=true;}if(!s.input.includes('e'))s.input+='e0';s.financialInputReady=true;return s;
      case 'backspace':if(s.entering){s.input=s.input.slice(0,-1);if(s.input.endsWith('e')||s.input.endsWith('e-'))s.input=s.input.split('e')[0];if(!s.input||s.input==='-')s.input='0';s.x=precision(Number(s.input));}else{s.x=0;s.input='0';s.lift=false;}return s;
      case 'enter':case 'equals':if(s.mode==='ALG'){algEquals(s);}else{lift(s);s.entering=false;s.lift=false;}return s;
      case 'plus':case 'minus':case 'multiply':case 'divide':case 'pow':{const op=({plus:'+',minus:'-',multiply:'*',divide:'/',pow:'^'} as Record<string,string>)[action];if(s.mode==='ALG')algPush(s,op);else binary(s,op);return finish(s);}
      case 'parenOpen':if(s.mode==='ALG'){s.algOperators.push('(');s.entering=false;s.lift=false;}return s;
      case 'parenClose':if(s.mode==='ALG'){s.algOperands.push(s.x);while(s.algOperators.length&&s.algOperators.at(-1)!=='(')algReduce(s);if(s.algOperators.pop()!=='(')throw new Error('Error 0');result(s,s.algOperands.pop()??s.x);}return s;
      case 'clx':s.x=0;s.input='0';s.entering=false;s.lift=false;s.financialInputReady=true;return s;
      case 'roll':{const x=s.x;s.x=s.y;s.y=s.z;s.z=s.t;s.t=x;s.entering=false;s.lift=true;return s;}
      case 'swap':[s.x,s.y]=[s.y,s.x];s.entering=false;s.lift=true;return s;
      case 'store':s.pendingRegister='store';s.registerDot=false;s.displayLabel='STO';return s;
      case 'recall':s.pendingRegister='recall';s.registerDot=false;s.displayLabel='RCL';return s;
      case 'lastX':recallValue(s,s.lastX,'LST x');return s;
      case 'modeRpn':case 'modeAlg':s.mode=action==='modeRpn'?'RPN':'ALG';s.algOperands=[];s.algOperators=[];s.pendingOp=null;s.entering=false;return s;
      case 'begin':s.tvm.begin=true;return s;
      case 'end':s.tvm.begin=false;return s;
      case 'n':case 'i':case 'pv':case 'pmt':case 'fv':financial(s,action);return s;
      case '12x':result(s,s.x*12,'n');s.tvm.n=s.x;s.financialInputReady=false;return s;
      case '12div':result(s,s.x/12,'i');s.tvm.i=s.x;s.financialInputReady=false;return s;
      case 'clearFin':s.tvm={n:0,i:0,pv:0,pmt:0,fv:0,begin:s.tvm.begin};s.financialInputReady=false;return s;
      case 'clearStats':for(let k=1;k<=6;k++)s.registers[k]=0;s.x=s.y=s.z=s.t=0;s.lift=false;return s;
      case 'clearReg':s.registers=Array(20).fill(0);s.cashflows=[0];s.cashflowCounts=[1];s.tvm={n:0,i:0,pv:0,pmt:0,fv:0,begin:s.tvm.begin};s.lastX=0;s.x=s.y=s.z=s.t=0;s.lift=false;return s;
      case 'amortize':{const count=Math.trunc(s.x);if(count<=0||s.tvm.i<0)throw new Error('Error 5');const round=(n:number)=>Number(n.toFixed(s.decimals));let balance=round(s.tvm.pv),interest=0,principal=0;for(let k=0;k<count;k++){const it=(s.tvm.begin&&s.tvm.n===0&&k===0)?0:round(-balance*s.tvm.i/100);const pr=round(s.tvm.pmt)-it;interest+=it;principal+=pr;balance+=pr;}s.tvm.pv=precision(balance);s.tvm.n+=count;result(s,interest,'AMORT');s.y=precision(principal);s.z=count;return s;}
      case 'interest':{const i=-s.tvm.pv*s.tvm.i*s.tvm.n/36000;result(s,i,'INT 360');s.y=-s.tvm.pv;s.z=precision(-s.tvm.pv*s.tvm.i*s.tvm.n/36500);return s;}
      case 'cf0':s.cashflows=[s.x];s.cashflowCounts=[1];s.registers[0]=s.x;s.tvm.n=0;s.entering=false;s.lift=true;return s;
      case 'cfj':{const j=Math.floor(s.tvm.n)+1;if(j<1||j>80||j>s.cashflows.length)throw new Error('Error 6');s.cashflows[j]=s.x;s.cashflowCounts[j]=1;s.tvm.n=j;if(j<20)s.registers[j]=s.x;s.entering=false;s.lift=true;return s;}
      case 'nj':{const j=Math.floor(s.tvm.n);if(s.x<1||s.x>99||s.x!==Math.floor(s.x)||j<0||j>=s.cashflows.length)throw new Error('Error 6');s.cashflowCounts[j]=s.x;s.entering=false;s.lift=true;return s;}
      case 'npv':case 'irr':{const count=Math.floor(s.tvm.n);if(count<0||count>=s.cashflows.length)throw new Error('Error 6');const fn=(r:number)=>{let total=s.registers[0],period=0;for(let j=1;j<=count;j++)for(let k=0;k<s.cashflowCounts[j];k++)total+=(j<20?s.registers[j]:s.cashflows[j])/Math.pow(1+r,++period);return total;};const value=action==='npv'?fn(s.tvm.i/100):root(fn,s.tvm.i/100)*100;result(s,value,action.toUpperCase());if(action==='irr')s.tvm.i=s.x;return s;}
      case 'bondPrice':case 'bondYield':{const dates=bondDates(s);if(action==='bondPrice'){const price=bondValue(s.tvm.i,s.tvm.pmt,dates);result(s,price,'PRICE');s.tvm.pv=s.x;s.y=precision(s.tvm.pmt/2*dates.a/dates.e);}else{const yieldValue=root(r=>bondValue(r*100,s.tvm.pmt,dates)-s.tvm.pv,s.tvm.i/100,-1.999,100)*100;result(s,yieldValue,'YTM');s.tvm.i=s.x;}s.tvm.fv=100+s.tvm.pmt/2;s.tvm.n=1-dates.a/dates.e;return s;}
      case 'deprSL':case 'deprSOYD':case 'deprDB':{const year=Math.trunc(s.x),n=s.tvm.n,cost=s.tvm.pv,salvage=s.tvm.fv;if(year<1||n<=0||cost<salvage)throw new Error('Error 5');let depreciation=0,book=cost;for(let k=1;k<=year;k++){depreciation=k>n?0:action==='deprSL'?(cost-salvage)/n:action==='deprSOYD'?(cost-salvage)*(n-k+1)/(n*(n+1)/2):Math.min(Math.max(0,book-salvage),book*s.tvm.i/100/n);book-=depreciation;}result(s,depreciation,action.slice(4));s.y=precision(book-salvage);return s;}
      case 'sigmaPlus':case 'sigmaMinus':{const sign=action==='sigmaPlus'?1:-1,x=s.x,y=s.y;const entries=[1,x,x*x,y,y*y,x*y];entries.forEach((v,k)=>s.registers[k+1]=precision(s.registers[k+1]+sign*v));result(s,s.registers[1],'n');s.lift=false;return s;}
      case 'mean':{const q=stats(s);statsPair(s,q.sx/q.n,q.sy/q.n,'x̄');return s;}
      case 'stddev':{const q=stats(s);if(q.n<=1)throw new Error('Error 2');statsPair(s,Math.sqrt(Math.max(0,(q.sxx-q.sx*q.sx/q.n)/(q.n-1))),Math.sqrt(Math.max(0,(q.syy-q.sy*q.sy/q.n)/(q.n-1))),'s');return s;}
      case 'weightedMean':{const q=stats(s);if(q.sx===0)throw new Error('Error 2');result(s,q.sxy/q.sx,'x̄w');return s;}
      case 'estimateX':case 'estimateY':{const q=regression(s);statsPair(s,action==='estimateY'?q.intercept+q.slope*s.x:(s.x-q.intercept)/q.slope,q.r,action==='estimateY'?'ŷ,r':'x̂,r');return s;}
      case 'reciprocal':result(s,1/s.x);return s;
      case 'sqrt':result(s,Math.sqrt(s.x));return s;
      case 'ln':result(s,Math.log(s.x));return s;
      case 'exp':result(s,Math.exp(s.x));return s;
      case 'square':result(s,s.x*s.x);return s;
      case 'intg':result(s,Math.trunc(s.x));return s;
      case 'frac':result(s,s.x-Math.trunc(s.x));return s;
      case 'factorial':{if(s.x<0||s.x>69||Math.trunc(s.x)!==s.x)throw new Error('Error 0');let value=1;for(let k=2;k<=s.x;k++)value*=k;result(s,value);return s;}
      case 'pct':result(s,(s.mode==='ALG'?(s.algOperands.at(-1)??s.y):s.y)*s.x/100,'%');return s;
      case 'pctT':result(s,s.x/(s.mode==='ALG'?(s.algOperands.at(-1)??s.y):s.y)*100,'%T');return s;
      case 'deltaPct':{const base=s.mode==='ALG'?(s.algOperands.at(-1)??s.y):s.y;result(s,(s.x-base)/base*100,'Δ%');return s;}
      case 'round':result(s,s.fixed?Number(s.x.toFixed(s.decimals)):Number(s.x.toPrecision(7)),'RND');return s;
      case 'scientific':s.fixed=false;s.entering=false;return s;
      case 'mdy':s.dateFormat='MDY';return s;
      case 'dmy':s.dateFormat='DMY';return s;
      case 'date':{const date=parseDate(s.y,s.dateFormat);date.setUTCDate(date.getUTCDate()+Math.trunc(s.x));if(date.getUTCFullYear()<1582||date.getUTCFullYear()>4046)throw new Error('Error 8');result(s,encodeDate(date,s.dateFormat),'DATE');drop(s);s.displayOverride=`${s.x.toFixed(6)} ${date.getUTCDay()||7}`;return s;}
      case 'days':{const a=parseDate(s.y,s.dateFormat),b=parseDate(s.x,s.dateFormat);result(s,(b.getTime()-a.getTime())/86400000,'ΔDYS');s.y=days360(a,b);return s;}
      case 'runStop':return run(s);
      case 'step':return run(s,true);
      case 'backStep':s.pc=Math.max(0,s.pc-1);s.displayLabel=`STEP ${s.pc}`;return s;
      case 'pause':s.paused=true;return s;
      case 'testZero':s.displayLabel=s.x===0?'VERDADEIRO':'FALSO';return s;
      case 'testLe':s.displayLabel=s.x<=s.y?'VERDADEIRO':'FALSO';return s;
      case 'prefix':s.shift=null;s.pendingRegister=null;s.pendingGoto=null;s.displayOverride=s.x.toPrecision(10).replace('.','');return s;
      case 'memory':s.displayOverride=`P${String(400-s.program.length).padStart(3,'0')} r20`;return s;
      case 'toggleAngular':s.angular=s.angular==='DEG'?'RAD':'DEG';return s;
      default:throw new Error(`Função desconhecida: ${action}`);
    }
  } catch(error){s.error=error instanceof Error?error.message:'Error 0';s.displayLabel=s.error;s.entering=false;s.running=false;return s;}
}
export function pressKey(previous:CalculatorState,id:string):CalculatorState {
  if(id==='f'||id==='g')return pressAction(previous,id==='f'?'shiftF':'shiftG');
  const action=resolveKeyAction(id,previous.shift);const next=pressAction(previous,action);next.shift=null;return next;
}
export function formatDisplay(s:CalculatorState):string {
  if(!s.powered)return '';if(s.error)return s.error;if(s.displayOverride)return s.displayOverride;
  if(s.programMode)return `${String(s.pc).padStart(3,'0')} ${s.program[s.pc-1]||''}`;
  if(s.entering)return s.input.replace('e',' E');
  if(!s.fixed||Math.abs(s.x)>=1e10||(s.x!==0&&Math.abs(s.x)<1e-9))return s.x.toExponential(6).replace('e+',' E+').replace('e-',' E-');
  const whole=Math.max(1,Math.floor(Math.log10(Math.abs(s.x)||1))+1),digits=Math.max(0,Math.min(s.decimals,10-whole));
  return s.x.toLocaleString('en-US',{minimumFractionDigits:digits,maximumFractionDigits:digits,useGrouping:true});
}
export function restoreState(value:unknown):CalculatorState {
  if(!value||typeof value!=='object'||(value as CalculatorState).schemaVersion!==2)return clone(INITIAL_STATE);
  const s=value as CalculatorState;if(!Array.isArray(s.registers)||s.registers.length!==20||!Number.isFinite(s.x))return clone(INITIAL_STATE);
  return {...clone(INITIAL_STATE),...structuredClone(s),running:false,paused:false,undoState:null};
}
