import { describe, it, expect } from 'vitest';
import { INITIAL_STATE, pressKey, pressAction, formatDisplay, restoreState, KEY_DEFINITIONS, type CalculatorState } from '@sagittaryuz/hp12c-core';
const start=()=>structuredClone(INITIAL_STATE);
const keys=(s:CalculatorState,...ids:string[])=>ids.reduce(pressKey,s);
const number=(s:CalculatorState,value:string)=>[...value].reduce((a,c)=>pressKey(a,c==='.'?'decimal':c),s);
const input=(s:CalculatorState,value:string,key:string)=>pressKey(number(s,value),key);
describe('HP 12c Platinum — operações e exemplos',()=>{
  it('empilha entradas e reaproveita T em RPN',()=>{
    let s=keys(start(),'2','enter','3','plus');expect(s.x).toBe(5);
    s=keys(s,'4','multiply');expect(s.x).toBe(20);expect(s.error).toBeNull();
    s=keys(start(),'2','enter','enter','enter','plus','plus','plus');expect(s.x).toBe(8);
  });
  it('porcentagem mantém a base na pilha para calcular o total',()=>{
    let s=number(start(),'300');s=pressKey(s,'enter');s=number(s,'25');s=pressKey(s,'pct');expect(s.x).toBe(75);expect(s.y).toBe(300);expect(pressKey(s,'plus').x).toBe(375);
  });
  it('ALG avalia da esquerda para a direita e respeita parênteses (manual pp. 26–27)',()=>{
    let s=pressAction(start(),'modeAlg');s=keys(s,'2','plus','3','multiply','4','enter');expect(s.x).toBe(20);
    s=pressAction(start(),'modeAlg');s=pressAction(s,'parenOpen');s=keys(s,'2','plus','3');s=pressAction(s,'parenClose');s=keys(s,'multiply','4','enter');expect(s.x).toBe(20);
  });
  it('guarda registradores estendidos e limita aritmética a R0–R4 (manual p. 251)',()=>{
    let s=keys(start(),'4','2','sto','decimal','5');expect(s.registers[15]).toBe(42);
    s=keys(s,'2','sto','plus','decimal','5');expect(s.error).toBe('Error 4');expect(s.registers[15]).toBe(42);
    s=keys(s,'clx','rcl','decimal','5');expect(s.x).toBe(42);
    expect(restoreState(JSON.parse(JSON.stringify(s))).registers[15]).toBe(42);
  });
  it('TVM: financiamento 250000 por 25 anos, 5,25% anual',()=>{
    let s=number(start(),'25');s=keys(s,'g','n');s=number(s,'5.25');s=keys(s,'g','i');s=input(s,'250000','pv');s=input(s,'0','fv');s=pressKey(s,'pmt');expect(s.error).toBeNull();expect(s.x).toBeCloseTo(-1498.12,2);
  });
  it('manual p. 69–70: primeira amortização anual e saldo',()=>{
    let s=start();s.tvm={n:0,i:.4375,pv:250000,pmt:-1498.12,fv:0,begin:false};s=number(s,'12');s=keys(s,'f','n');expect(s.x).toBe(-13006.53);expect(s.y).toBe(-4970.91);expect(s.tvm.pv).toBe(245029.09);expect(s.tvm.n).toBe(12);
  });
  it('CF₀/CFⱼ/Nⱼ e NPV/IRR respeitam repetições',()=>{
    let s=number(start(),'1000');s=keys(s,'chs','g','pv');s=number(s,'500');s=keys(s,'g','pmt');s=number(s,'3');s=keys(s,'g','fv');s.tvm.i=10;s=keys(s,'f','pv');expect(s.x).toBeCloseTo(243.4259955,6);
    s=keys(s,'f','fv');expect(s.x).toBeCloseTo(23.375190,4);
  });
  it('estatísticas de x,y usam R1–R6 e amostras',()=>{
    let s=start();for(const [x,y] of [[1,2],[2,4],[3,6]]){s=number(s,String(y));s=pressKey(s,'enter');s=number(s,String(x));s=pressKey(s,'sigma');}
    s=keys(s,'g','0');expect(s.x).toBe(2);expect(s.y).toBe(4);
    s=keys(s,'g','decimal');expect(s.x).toBe(1);expect(s.y).toBe(2);
    s=number(s,'4');s=keys(s,'g','2');expect(s.x).toBe(8);expect(s.y).toBe(1);
  });
  it('calendário soma dias e calcula diferenças real/30-360',()=>{
    let s=number(start(),'5.142004');s=pressKey(s,'enter');s=number(s,'120');s=keys(s,'g','chs');expect(s.x).toBe(9.112004);expect(formatDisplay(s)).toContain('6');
    s=number(start(),'3.012004');s=pressKey(s,'enter');s=number(s,'4.012004');s=keys(s,'g','eex');expect(s.x).toBe(31);expect(s.y).toBe(30);
  });
  it('manual p. 82–83: preço e rendimento de título',()=>{
    let s=start();s.tvm.i=4.75;s.tvm.pmt=6.75;s=number(s,'4.282004');s=pressKey(s,'enter');s=number(s,'6.042018');s=keys(s,'f','pow');expect(s.x).toBeCloseTo(120.38,2);expect(s.x+s.y).toBeCloseTo(123.07,2);
    s=start();s.tvm.pv=122.125;s.tvm.pmt=6.75;s=number(s,'4.282004');s=pressKey(s,'enter');s=number(s,'6.042018');s=keys(s,'f','reciprocal');expect(s.x).toBeCloseTo(4.60,2);
  });
  it('depreciação DB do manual: 4000, 2400, 1440',()=>{
    let s=start();s.tvm={n:5,i:200,pv:10000,pmt:0,fv:500,begin:false};for(const [year,expected] of [[1,4000],[2,2400],[3,1440]]){s=number(s,String(year));s=keys(s,'f','pct');expect(s.x).toBe(expected);}
  });
  it('grava e executa programa e respeita R/S',()=>{
    let s=keys(start(),'f','rs','2','multiply','rs','f','rs');expect(s.program).toEqual(['2','multiply','runStop']);s=number(s,'7');s=pressKey(s,'rs');expect(s.x).toBe(14);expect(s.error).toBeNull();
  });
  it('entrada científica, arredondamento explícito e erros',()=>{
    let s=keys(start(),'2','eex','3');expect(s.x).toBe(2000);s=keys(start(),'0','reciprocal');expect(s.error).toBe('Error 0');
    s=number(start(),'1.23456789');s=keys(s,'f','pmt');expect(s.x).toBe(1.23);
  });
  it('programa agrupa STO/RCL e operadores em uma linha, inclusive SST',()=>{
    let s=keys(start(),'f','rs','sto','4','2','sto','plus','4','rcl','4','rs','f','rs');
    expect(s.program).toEqual(['sequence:store,4','2','sequence:store,plus,4','sequence:recall,4','runStop']);
    s=number(s,'7');s=pressKey(s,'sst');expect(s.registers[4]).toBe(7);expect(s.pc).toBe(1);
    s=pressKey(s,'rs');expect(s.x).toBe(9);expect(s.registers[4]).toBe(9);
  });
  it('condicionais saltam instrução completa e GTO inválido gera Error 4',()=>{
    let s=start();s.program=['testZero','sequence:store,0','2','runStop'];s=number(s,'7');s=pressKey(s,'rs');expect(s.registers[0]).toBe(0);expect(s.x).toBe(2);
    s=start();s.program=['goto:099'];s=pressKey(s,'rs');expect(s.error).toBe('Error 4');
  });
  it('visor de programa usa códigos físicos e MEM mostra linhas alocadas',()=>{
    let s=keys(start(),'f','rs','enter');expect(formatDisplay(s)).toBe('001, 36');
    s=keys(s,'sto','plus','0');expect(formatDisplay(s)).toBe('002, 44 40 0');
    s=keys(s,'g','roll','0','0','0');expect(formatDisplay(s)).toBe('003, 43,33,000');
    s=keys(s,'f','rs','g','9');expect(formatDisplay(s)).toBe('P008 r20');
  });
  it('CLEAR Σ e CLEAR REG encerram entrada e zeram o visor',()=>{
    for(const key of ['sst','clx']){
      let s=keys(start(),'1','2','3','f',key);expect(formatDisplay(s)).toBe('0.00');s=pressKey(s,'4');expect(s.x).toBe(4);
    }
  });
  it('recupera fluxos de caixa, edita registrador e respeita n corrente',()=>{
    let s=number(start(),'100');s=keys(s,'chs','g','pv');s=number(s,'200');s=keys(s,'g','pmt');s=number(s,'3');s=keys(s,'g','fv');
    s=keys(s,'rcl','g','fv');expect(s.x).toBe(3);s=keys(s,'rcl','g','pmt');expect(s.x).toBe(200);expect(s.tvm.n).toBe(0);
    s=number(s,'150');s=keys(s,'sto','1');s.tvm.n=1;s.tvm.i=0;s=keys(s,'f','pv');expect(s.x).toBe(350);
  });
  it('TVM resolve juros negativos e pagamentos antecipados',()=>{
    let s=start();s.tvm={n:12,i:0,pv:-1000,pmt:0,fv:900,begin:false};s=pressKey(s,'i');expect(s.x).toBeCloseTo((Math.pow(.9,1/12)-1)*100,7);
    s=start();s.tvm={n:12,i:1,pv:1000,pmt:0,fv:0,begin:true};s=pressKey(s,'pmt');expect(s.x).toBeCloseTo(-1000/(1.01*(1-Math.pow(1.01,-12))/.01),6);
  });
  it('juros simples, SL, SOYD e funções matemáticas',()=>{
    let s=start();s.tvm={n:60,i:7,pv:-1000,pmt:0,fv:0,begin:false};s=keys(s,'f','i');expect(s.x).toBeCloseTo(11.66666667,6);expect(s.z).toBeCloseTo(11.50684932,6);
    s=start();s.tvm={n:5,i:0,pv:10000,pmt:0,fv:1000,begin:false};s=number(s,'2');s=keys(s,'f','pctT');expect(s.x).toBe(1800);expect(s.y).toBe(5400);
    s=number(s,'2');s=keys(s,'f','deltaPct');expect(s.x).toBe(2400);expect(s.y).toBe(3600);
    s=keys(start(),'5','g','3');expect(s.x).toBe(120);s=keys(start(),'9','g','pow');expect(s.x).toBe(3);
    s=number(start(),'2');s=keys(s,'g','reciprocal','g','pctT');expect(s.x).toBeCloseTo(2,8);
  });
  it('ALG porcentagens, D.MY e memória após desligar',()=>{
    let s=pressAction(start(),'modeAlg');s=number(s,'300');s=pressKey(s,'plus');s=number(s,'25');s=keys(s,'pct','enter');expect(s.x).toBe(375);
    s=keys(start(),'g','4');s=number(s,'14.052004');s=pressKey(s,'enter');s=number(s,'120');s=keys(s,'g','chs');expect(s.x).toBe(11.092004);
    s=keys(start(),'4','2','sto','5','f','on');expect(s.powered).toBe(false);s=pressKey(s,'on');s=keys(s,'rcl','5');expect(s.x).toBe(42);
  });
  it('tem 39 teclas originais e três extensões trigonométricas implementadas',()=>{
    expect(KEY_DEFINITIONS).toHaveLength(42);
    const actions=new Set(KEY_DEFINITIONS.flatMap(k=>[k.action,k.fAction,k.gAction]).filter(Boolean));
    for(const action of actions){const s=pressAction(start(),action);expect(s.error||'').not.toContain('desconhecida');}
  });
});

describe('Regressões verificadas no manual Platinum enviado',()=>{
  it('pp. 26 e 242: sequência ALG 456 − 75 ÷ 18,5 × 68 ÷ 1,9',()=>{
    let s=pressAction(start(),'modeAlg');s=number(s,'456');s=pressKey(s,'minus');s=number(s,'75');s=pressKey(s,'divide');expect(s.x).toBe(381);
    s=number(s,'18.5');s=pressKey(s,'multiply');s=number(s,'68');s=pressKey(s,'divide');s=number(s,'1.9');s=pressKey(s,'enter');expect(s.x).toBeCloseTo(737.0697013,6);
  });
  it('p. 246: porcentagem ALG isolada, multiplicação e desconto',()=>{
    let s=pressAction(start(),'modeAlg');s=number(s,'25');expect(pressKey(s,'pct').x).toBe(.25);
    s=pressAction(start(),'modeAlg');s=number(s,'200');s=pressKey(s,'multiply');s=number(s,'25');s=keys(s,'pct','enter');expect(s.x).toBe(50);
    s=pressAction(start(),'modeAlg');s=number(s,'200');s=pressKey(s,'minus');s=number(s,'25');s=keys(s,'pct','enter');expect(s.x).toBe(150);
  });
  it('pp. 246–247: Δ% e %T após resultado ALG',()=>{
    let s=pressAction(start(),'modeAlg');s=number(s,'35.5');s=pressKey(s,'enter');s=number(s,'31.25');s=pressKey(s,'deltaPct');expect(s.x).toBeCloseTo(-11.97183099,6);
    s=pressAction(start(),'modeAlg');s=number(s,'3.92');s=pressKey(s,'plus');s=number(s,'2.36');s=pressKey(s,'plus');s=number(s,'1.67');s=pressKey(s,'enter');s=number(s,'2.36');s=pressKey(s,'pctT');expect(s.x).toBeCloseTo(29.68553459,6);
  });
  it('pp. 26–27: parênteses aninhados e fechamento automático com igual',()=>{
    let s=pressAction(start(),'modeAlg');s=keys(s,'8','divide','g','sto','5','minus','1','g','rcl','enter');expect(s.x).toBe(2);
    s=pressAction(start(),'modeAlg');s=keys(s,'8','divide','g','sto','5','minus','1','enter');expect(s.x).toBe(2);
  });
  it('p. 251: no máximo 13 parênteses abertos',()=>{
    let s=pressAction(start(),'modeAlg');for(let n=0;n<13;n++)s=pressAction(s,'parenOpen');expect(s.error).toBeNull();s=pressAction(s,'parenOpen');expect(s.error).toBe('Error 4');
  });
  it('p. 19: CLx duas vezes cancela expressão ALG pendente',()=>{
    let s=pressAction(start(),'modeAlg');s=keys(s,'8','plus','2','clx','clx','3','enter');expect(s.x).toBe(3);expect(s.algOperators).toEqual([]);
  });
  it('p. 20: UNDO recupera apagamentos e não desfaz cálculos',()=>{
    let s=keys(start(),'4','2','clx','g','minus');expect(s.x).toBe(42);
    s=keys(start(),'2','enter','3','plus','g','minus');expect(s.x).toBe(5);
    s=start();s.tvm.pv=100;s=keys(s,'f','swap','g','minus');expect(s.tvm.pv).toBe(100);
  });
  it('p. 251: aritmética STO permitida apenas em R0–R4',()=>{
    for(let idx=0;idx<5;idx++){let s=start();s.registers[idx]=20;s=keys(s,'2','sto','divide',String(idx));expect(s.registers[idx]).toBe(10);}
    for(const idx of ['5','9']){let s=keys(start(),'2','sto','plus',idx);expect(s.error).toBe('Error 4');}
  });
  it('p. 250: domínio de potência, LN, raiz, inverso e percentuais',()=>{
    for(const action of ['reciprocal','ln','deltaPct','pctT'])expect(pressAction(start(),action).error).toBe('Error 0');
    let s=keys(start(),'0','enter','0','pow');expect(s.error).toBe('Error 0');s=start();s.x=-1;expect(pressAction(s,'sqrt').error).toBe('Error 0');
  });
  it('p. 89: erro não destrói pilha nem os dados antes da operação',()=>{
    let s=start();s.x=0;s.y=12;s.z=7;s=pressKey(s,'divide');expect(s.error).toBe('Error 0');expect([s.x,s.y,s.z]).toEqual([0,12,7]);s=pressKey(s,'5');expect(s.error).toBeNull();expect(s.x).toBe(0);
  });
  it('pp. 17 e 88: expoente negativo e formato científico de sete dígitos',()=>{
    let s=keys(start(),'2','eex','chs','3');expect(s.x).toBe(.002);
    s=number(start(),'14.8745632');s=keys(s,'f','decimal');expect(formatDisplay(s)).toBe('1.487456 01');
    s=number(start(),'0.002');s=keys(s,'f','decimal');expect(formatDisplay(s)).toBe('2.000000 -03');
  });
  it('p. 89: CLEAR PREFIX mostra apenas os dez dígitos da mantissa',()=>{
    let s=number(start(),'14.8745632');s=keys(s,'f','enter');expect(formatDisplay(s)).toBe('1487456320');expect(s.x).toBe(14.8745632);
    s=number(start(),'0.002');s=keys(s,'f','enter');expect(formatDisplay(s)).toBe('2000000000');
  });
  it('p. 89: estouro numérico satura e underflow resulta em zero',()=>{
    let s=start();s.x=1e99;s.y=100;s=pressKey(s,'multiply');expect(s.error).toBeNull();expect(s.x).toBe(9.999999999e99);
    s=start();s.x=100;s.y=1e-99;s=pressKey(s,'divide');expect(s.x).toBe(0);
  });
  it('p. 250: estouro na aritmética de registrador gera Error 1',()=>{
    let s=start();s.registers[0]=1e99;s.x=100;s=keys(s,'sto','multiply','0');expect(s.error).toBe('Error 1');expect(s.registers[0]).toBe(1e99);
  });
  it('p. 49: n é arredondado para baixo quando a fração é menor que 0,005',()=>{
    let s=start();s.tvm={n:0,i:0,pv:-100.004,pmt:1,fv:0,begin:false};s=pressKey(s,'n');expect(s.x).toBe(100);
    s=start();s.tvm={n:0,i:0,pv:-100.006,pmt:1,fv:0,begin:false};s=pressKey(s,'n');expect(s.x).toBe(101);
  });
  it('p. 252: AMORT e depreciação rejeitam período não inteiro',()=>{
    for(const action of ['amortize','deprSL','deprSOYD','deprDB']){let s=start();s.tvm.n=5;s.x=1.5;expect(pressAction(s,action).error).toBe('Error 5');}
  });
  it('p. 252: Nj aceita zero e rejeita ocorrências para CF0',()=>{
    let s=keys(start(),'1','g','pv','g','fv');expect(s.error).toBe('Error 6');
    s=keys(start(),'1','g','pv','2','g','pmt','0','g','fv');expect(s.error).toBeNull();expect(s.cashflowCounts[1]).toBe(0);s=keys(s,'f','pv');expect(s.x).toBe(1);
  });
  it('pp. 252 e 248: fluxos inteiros e IRR sem mudança de sinal',()=>{
    let s=start();s.tvm.n=1.5;expect(pressAction(s,'cfj').error).toBe('Error 6');
    s=keys(start(),'1','g','pv','2','g','pmt','f','fv');expect(s.error).toBe('Error 7');
  });
  it('p. 37: datas limitadas a 15/10/1582–25/11/4046',()=>{
    for(const value of ['10.141582','11.264046']){let s=number(start(),value);s=pressKey(s,'enter');s=keys(s,'0','g','chs');expect(s.error).toBe('Error 8');}
    let s=number(start(),'10.151582');s=pressKey(s,'enter');s=keys(s,'0','g','chs');expect(s.error).toBeNull();
  });
  it('p. 253: títulos rejeitam cupom impossível seis meses antes e cupom negativo',()=>{
    let s=number(start(),'6.012004');s=pressKey(s,'enter');s=number(s,'12.312005');s=keys(s,'f','pow');expect(s.error).toBe('Error 8');
    s=start();s.tvm.pmt=-1;s.y=4.282004;s.x=6.042018;expect(pressAction(s,'bondPrice').error).toBe('Error 5');
  });
  it('pp. 112 e 138: SST mostra linhas vazias e edição substitui instrução',()=>{
    let s=keys(start(),'f','rs','sst');expect(formatDisplay(s)).toBe('001, 43,33,000');
    s=keys(start(),'f','rs','1','2','3','g','roll','decimal','0','0','1','9');expect(s.program).toEqual(['1','9','3']);
  });
  it('p. 251: limite de 400 linhas preserva programa em caso de erro',()=>{
    let s=start();s.programMode=true;s.program=Array(400).fill('1');s.pc=400;s=pressKey(s,'2');expect(s.error).toBe('Error 4');expect(s.program).toHaveLength(400);
  });
  it('p. 17: separador decimal configurável e persistente',()=>{
    let s=number(start(),'1234.5');s=pressKey(s,'enter');s=pressAction(s,'toggleSeparator');expect(formatDisplay(s)).toBe('1.234,50');expect(restoreState(s).decimalComma).toBe(true);
  });
  it('p. 95: média ponderada e cancelamento de par estatístico',()=>{
    let s=start();for(const [item,weight] of [[1.16,15],[1.24,7],[1.20,10],[1.18,17]]){s=number(s,String(item));s=pressKey(s,'enter');s=number(s,String(weight));s=pressKey(s,'sigma');}s=keys(s,'g','6');expect(s.x).toBeCloseTo(1.186530612,8);
    s=keys(start(),'4','enter','2','sigma','g','plus','swap','g','sigma');expect(s.registers[1]).toBe(0);
  });
});

describe('Pilha financeira — manual pp. 237–238',()=>{
  it('resultado TVM preserva X/Y/Z na pilha e LAST X',()=>{
    let s=start();s.x=3;s.y=4;s.z=5;s.t=6;s.lastX=99;s.tvm={n:1,i:10,pv:-100,pmt:0,fv:0,begin:false};s=pressKey(s,'fv');expect([s.x,s.y,s.z,s.t,s.lastX]).toEqual([110,3,4,5,99]);
  });
  it('juros simples colocam o X anterior em T',()=>{
    let s=start();s.x=3;s.t=6;s.lastX=99;s.tvm={n:360,i:10,pv:-100,pmt:0,fv:0,begin:false};s=keys(s,'f','i');expect(s.x).toBe(10);expect(s.y).toBe(100);expect(s.t).toBe(3);expect(s.lastX).toBe(99);
  });
  it('amortização preserva Y anterior em T',()=>{
    let s=start();s.x=1;s.y=42;s.tvm={n:0,i:1,pv:100,pmt:-10,fv:0,begin:false};s=keys(s,'f','n');expect([s.x,s.y,s.z,s.t]).toEqual([-1,-9,1,42]);
  });
  it('CHS preserva LAST X e visor de estouro não vira expoente 100',()=>{
    let s=start();s.x=3;s.lastX=99;s=pressKey(s,'chs');expect(s.lastX).toBe(99);s.x=9.999999999e99;s.entering=false;expect(formatDisplay(s)).toBe('9.999999 99');
  });
});

it('agrupa milhares na entrada sem perder sinal, zeros, decimal ou expoente e sem alterar X',()=>{
 for(const decimalComma of [true,false])for(const [input,comma,point]of [['1234','1.234','1,234'],['1234567.00','1.234.567,00','1,234,567.00'],['-1234.','-1.234,','-1,234.'],['1234.50e-2','1.234,50 E-2','1,234.50 E-2'],['0.000','0,000','0.000']]){
  const s={...start(),entering:true,input,x:Number(input)};s.decimalComma=decimalComma;const x=s.x;expect(formatDisplay(s)).toBe(decimalComma?comma:point);expect(s.input).toBe(input);expect(s.x).toBe(x);
 }
});
describe('Cobertura restante das funções impressas',()=>{
  it('matemática unária, LAST X e fatorial no limite',()=>{
    const cases:[string,number,number][]=[['reciprocal',4,.25],['square',3,9],['intg',-1.75,-1],['frac',-1.75,-.75],['factorial',0,1],['factorial',70,9.999999999e99]];
    for(const [action,input,expected] of cases){let s=start();s.x=input;s=pressAction(s,action);expect(s.x).toBe(expected);expect(s.error).toBeNull();expect(pressAction(s,'lastX').x).toBe(input);}
  });
  it('R↓ e x↔y preservam LAST X',()=>{
    let s=start();s.x=1;s.y=2;s.z=3;s.t=4;s.lastX=9;s=pressKey(s,'roll');expect([s.x,s.y,s.z,s.t]).toEqual([2,3,4,1]);s=pressKey(s,'swap');expect([s.x,s.y]).toEqual([3,2]);expect(s.lastX).toBe(9);
  });
  it('PV, PMT, n e i retornam os valores de uma mesma anuidade',()=>{
    const base={n:12,i:1,pv:-100,pmt:0,fv:112.682503,begin:false};
    let s=start();s.tvm={...base,pv:0};s=pressKey(s,'pv');expect(s.x).toBeCloseTo(-100,6);
    s=start();s.tvm={...base,pmt:0};s=pressKey(s,'pmt');expect(s.x).toBeCloseTo(0,6);
    s=start();s.tvm={...base,i:0};s=pressKey(s,'i');expect(s.x).toBeCloseTo(1,6);
  });
  it('período fracionário pode usar juros simples ou compostos (STO EEX)',()=>{
    let s=start();s.tvm={n:1.5,i:10,pv:-100,pmt:0,fv:0,begin:false};s=pressKey(s,'fv');expect(s.x).toBeCloseTo(115.5,7);
    s=start();s.tvm={n:1.5,i:10,pv:-100,pmt:0,fv:0,begin:false};s=keys(s,'sto','eex','fv');expect(s.compoundOdd).toBe(true);expect(s.x).toBeCloseTo(100*Math.pow(1.1,1.5),6);
  });
  it('FIX preserva precisão interna e RND altera o valor',()=>{
    let s=number(start(),'1.23456789');s=keys(s,'f','4');expect(formatDisplay(s)).toBe('1.2346');expect(s.x).toBe(1.23456789);s=keys(s,'f','pmt');expect(s.x).toBe(1.2346);
  });
  it('CLEAR PRGM e conditional verdadeiro seguidos de PSE',()=>{
    let s=start();s.program=['testLe','2','pause','3','runStop'];s.x=1;s.y=5;s=pressKey(s,'rs');expect(s.x).toBe(2);expect(s.paused).toBe(true);expect(s.pc).toBe(3);s=pressKey(s,'rs');expect(s.x).toBe(3);expect(s.paused).toBe(false);
    s=keys(s,'f','rs','f','roll');expect(s.program).toEqual([]);expect(s.pc).toBe(0);
  });
  it('NPV/IRR para 80 fluxos e Nj repetido',()=>{
    let s=start();s=number(s,'80');s=keys(s,'chs','g','pv');for(let n=0;n<80;n++)s=keys(s,'1','g','pmt');s=keys(s,'f','pv');expect(s.x).toBe(0);s=keys(s,'f','fv');expect(s.x).toBeCloseTo(0,6);s=keys(s,'1','g','pmt');expect(s.error).toBe('Error 6');
  });
});

describe('Estatística — condições especiais do apêndice D',()=>{
  it('média, desvio e média ponderada preservam LAST X',()=>{
    let s=start();s.lastX=99;s.registers=[0,2,3,5,6,20,10,...Array(13).fill(0)];
    for(const action of ['mean','stddev','weightedMean'])expect(pressAction(s,action).lastX).toBe(99);
  });
  it('ŷ de uma constante existe, mas sua correlação não é definida',()=>{
    let s=start();s.registers=[0,3,6,14,6,12,12,...Array(13).fill(0)];s.x=4;s=pressAction(s,'estimateY');expect(s.x).toBe(2);expect(s.error).toBeNull();s=pressKey(s,'swap');expect(s.error).toBe('Error 2');
  });
});

import { displayDefaults, initializeDefaults, DEFAULT_RATE_PROGRAM } from '../src/defaults';
describe('padrões solicitados para a aplicação',()=>{
  it('preserva sete casas escolhidas após ENTER e mostra a entrada crua',()=>{
    let s=initializeDefaults({...start(),decimals:7,decimalComma:true},true);
    expect(formatDisplay(s)).toBe('0,0000000');
    s=displayDefaults(keys(s,'2'));expect(formatDisplay(s)).toBe('2');
    s=displayDefaults(keys(s,'decimal'));expect(formatDisplay(s)).toBe('2,');
    s=displayDefaults(keys(s,'5','0'));expect(formatDisplay(s)).toBe('2,50');
    s=displayDefaults(keys(s,'enter'));expect(formatDisplay(s)).toBe('2,5000000');
    s=displayDefaults(keys(s,'3'));expect(formatDisplay(s)).toBe('3');
    s=displayDefaults(keys(s,'plus'));expect(formatDisplay(s)).toBe('5,5000000');
  });
  it.each(Array.from({length:10},(_,i)=>i))('f + %i escolhe FIX e não altera o número interno',decimals=>{
    let s=initializeDefaults({...start(),decimals:7,decimalComma:true},true);
    s=number(s,'1.23456789');const x=s.x;
    s=displayDefaults(pressKey(s,'f'));expect(formatDisplay(s)).toBe('1,23456789');
    s=displayDefaults(pressKey(s,String(decimals)));
    expect(s.decimals).toBe(decimals);expect(s.fixed).toBe(true);expect(s.decimalComma).toBe(true);expect(s.x).toBe(x);expect(s.shift).toBeNull();
    expect(formatDisplay(s)).toBe(x.toLocaleString('pt-BR',{minimumFractionDigits:decimals,maximumFractionDigits:decimals}));
    s=displayDefaults(keys(s,'2'));expect(formatDisplay(s)).toBe('2');
    s=displayDefaults(keys(s,'enter'));expect(formatDisplay(s)).toBe(decimals?'2,'+'0'.repeat(decimals):'2');
    s=initializeDefaults(restoreState(JSON.parse(JSON.stringify(s))),false,false);expect(s.decimals).toBe(decimals);
  });
  it('f + decimal seleciona SCI; entrada continua crua e FIX restaura o formato',()=>{
    let s=initializeDefaults({...start(),decimals:7,decimalComma:true},true);s=displayDefaults(keys(number(s,'123'),'f','decimal'));
    expect(s.fixed).toBe(false);expect(formatDisplay(s)).toBe('1,230000 02');
    s=displayDefaults(keys(s,'4','decimal','5'));expect(formatDisplay(s)).toBe('4,5');
    s=displayDefaults(keys(s,'enter'));expect(formatDisplay(s)).toBe('4,500000 00');
    s=initializeDefaults(restoreState(JSON.parse(JSON.stringify(s))),false,false);expect(s.fixed).toBe(false);
    s=displayDefaults(keys(s,'f','2'));expect(formatDisplay(s)).toBe('4,50');
    s=displayDefaults(pressAction(s,'toggleSeparator'));expect(s.decimalComma).toBe(false);
  });
  it('programa do vídeo converte 12% anual para mensal e pode repetir',()=>{
    let s=initializeDefaults({...start(),decimals:7,decimalComma:true},true);
    s=input(s,'12','i');s=input(s,'12','n');s=number(s,'1');s=displayDefaults(pressKey(s,'rs'));
    expect(s.error).toBeNull();expect(s.x).toBeCloseTo((Math.pow(1.12,1/12)-1)*100,6);
    expect(s.pc).toBe(0);expect(s.program).toEqual(DEFAULT_RATE_PROGRAM);
    expect(formatDisplay(s)).toBe('0,9488793');
    s=input(s,'1','i');s=input(s,'1','n');s=number(s,'12');s=displayDefaults(pressKey(s,'rs'));
    expect(s.error).toBeNull();expect(s.x).toBeCloseTo((Math.pow(1.01,12)-1)*100,6);
  });
  it('a migração preserva entradas e configura o programa uma vez; reabertura preserva edições',()=>{
    let old=start();old.x=42;old.program=['2','multiply','runStop'];old.decimalComma=false;
    const migrated=initializeDefaults(restoreState(JSON.parse(JSON.stringify(old))),true);
    expect(migrated.x).toBe(42);expect(migrated.program).toEqual(DEFAULT_RATE_PROGRAM);
    const custom={...migrated,program:['3','multiply','runStop'],decimals:2,decimalComma:false};
    const reopened=initializeDefaults(restoreState(JSON.parse(JSON.stringify(custom))),false);
    expect(reopened.program).toEqual(custom.program);expect(reopened.decimals).toBe(2);expect(reopened.decimalComma).toBe(false);
  });
  it('atualização preserva doze casas legadas e não reinstala nem apaga o programa',()=>{
    const old={...start(),x:42,decimals:12,program:['3','multiply','runStop'],registers:Array(20).fill(19)};
    const migrated=initializeDefaults(old,false,true);
    expect(migrated.x).toBe(42);expect(migrated.decimals).toBe(12);expect(migrated.program).toEqual(old.program);expect(migrated.registers).toEqual(old.registers);
    const resetProgram=initializeDefaults({...migrated,decimals:4},true,false);expect(resetProgram.program).toEqual(DEFAULT_RATE_PROGRAM);expect(resetProgram.decimals).toBe(4);
  });
});

describe('extensões SIN, COS e TAN',()=>{
 it('calcula ângulos em graus sem modificar os demais níveis da pilha',()=>{
  let s=start();s.y=12;s.z=34;s.t=56;
  for(const [angle,key,expected] of [[30,'sin',.5],[60,'cos',.5],[45,'tan',1],[-30,'sin',-.5],[180,'sin',0],[270,'cos',0]] as const){
   let entered=number(s,String(Math.abs(angle)));if(angle<0)entered=pressKey(entered,'chs');
   const value=keys(entered,key);expect(value.x).toBeCloseTo(expected,9);expect(value.y).toBe(12);expect(value.z).toBe(34);expect(value.t).toBe(56);expect(value.lastX).toBe(angle);
  }
 });
 it('calcula radianos e preserva essa opção ao restaurar a sessão',()=>{
  let s=pressAction(start(),'toggleAngular');s=number(s,String(Math.PI/2));s=pressKey(s,'sin');expect(s.x).toBeCloseTo(1,8);expect(restoreState(JSON.parse(JSON.stringify(s))).angular).toBe('RAD');
 });
 it('informa erro nas singularidades da tangente e permite continuar',()=>{
  for(const angle of [90,270,-90]){let s=number(start(),String(Math.abs(angle)));if(angle<0)s=pressKey(s,'chs');s=pressKey(s,'tan');expect(s.error).toBe('Error 0');s=keys(s,'clx','clx','3','0','sin');expect(s.error).toBeNull();expect(s.x).toBe(.5);}
 });
 it('grava e executa as novas funções em programas',()=>{
  let s=keys(start(),'f','rs','3','0','sin','cos','tan');expect(s.program).toEqual(['3','0','sin','cos','tan']);
  s=keys(s,'f','rs','rs');expect(s.error).toBeNull();expect(s.x).toBeCloseTo(Math.tan(Math.cos(.5*Math.PI/180)*Math.PI/180),8);
 });
 it('exibe os resultados no formato fixo solicitado',()=>{
  const s=displayDefaults(keys(number(initializeDefaults({...start(),decimals:7,decimalComma:true},true),'30'),'sin'));expect(formatDisplay(s)).toBe('0,5000000');
 });
});

describe('atalhos f/g e entrada — regressões da aplicação',()=>{
 const appKeys=(s:CalculatorState,...ids:string[])=>ids.reduce((state,id)=>displayDefaults(pressKey(state,id)),s);
 const appStart=()=>initializeDefaults({...start(),decimals:7,decimalComma:true},true);
 it('CHS e apagar preservam a vírgula e os zeros digitados',()=>{
  let s=appKeys(appStart(),'1','2','decimal','3','0','chs');expect(formatDisplay(s)).toBe('-12,30');
  s=appKeys(s,'g','divide');expect(formatDisplay(s)).toBe('-12,3');
  s=appKeys(s,'g','divide');expect(formatDisplay(s)).toBe('-12,');
  s=appKeys(s,'chs');expect(formatDisplay(s)).toBe('12,');
  s=appKeys(s,'enter');expect(formatDisplay(s)).toBe('12,0000000');
  s=appKeys(appStart(),'0','chs','3');expect(formatDisplay(s)).toBe('-3');
 });
 it('RND aplica o FIX escolhido e LAST X mantém o valor anterior',()=>{
  let s=appKeys(appStart(),'1','decimal','2','3','4','5','6','f','2');expect(s.x).toBe(1.23456);expect(formatDisplay(s)).toBe('1,23');
  s=appKeys(s,'f','pmt');expect(s.x).toBe(1.23);expect(s.lastX).toBe(1.23456);
  s=appKeys(s,'g','plus');expect(s.x).toBe(1.23456);expect(formatDisplay(s)).toBe('1,23');expect(s.decimals).toBe(2);
 });
 it('g n, g i, BEG/END e datas respeitam o FIX atual',()=>{
  let s=appKeys(appStart(),'f','3','2','g','n');expect(s.tvm.n).toBe(24);expect(formatDisplay(s)).toBe('24,000');
  s=appKeys(s,'2','4','g','i');expect(s.tvm.i).toBe(2);expect(formatDisplay(s)).toBe('2,000');
  s=appKeys(s,'g','7');expect(s.tvm.begin).toBe(true);s=appKeys(s,'g','8');expect(s.tvm.begin).toBe(false);
  s=appKeys(s,'g','4');expect(s.dateFormat).toBe('DMY');s=appKeys(s,'g','5');expect(s.dateFormat).toBe('MDY');expect(s.decimals).toBe(3);
 });
 it('ALG/RPN e CLEAR FIN conservam memória, programa e FIX',()=>{
  let s=appKeys(appStart(),'f','4','4','2','sto','5','f','eex');expect(s.mode).toBe('ALG');
  s=appKeys(s,'2','plus','3','multiply','4','enter');expect(s.x).toBe(20);
  s=appKeys(s,'f','chs');expect(s.mode).toBe('RPN');s=appKeys(s,'f','swap');expect(s.tvm.i).toBe(0);expect(s.registers[5]).toBe(42);expect(s.program).toEqual(DEFAULT_RATE_PROGRAM);
  s=appKeys(s,'rcl','5');expect(formatDisplay(s)).toBe('42,0000');expect(s.decimals).toBe(4);
 });
 it('R↓ roda os quatro registradores sem alterar LAST X ou FIX',()=>{
  let s={...appStart(),x:1,y:2,z:3,t:4,lastX:99};s=appKeys(s,'roll');expect([s.x,s.y,s.z,s.t]).toEqual([2,3,4,1]);expect(s.lastX).toBe(99);expect(formatDisplay(s)).toBe('2,0000000');
 });
 it('FIX antigo de doze casas também não completa a entrada antes de ENTER',()=>{
  let s={...start(),decimals:12,decimalComma:true};s=appKeys(s,'2','decimal','5','0');expect(formatDisplay(s)).toBe('2,50');s=appKeys(s,'enter');expect(formatDisplay(s)).toBe('2,500000000000');
 });
});


it.each([false,true])('formato escolhido permanece em reaberturas e ações com separador %s',decimalComma=>{
 const original={...INITIAL_STATE,x:1.23456789,decimals:4,decimalComma,program:['3','multiply'],registers:Array(20).fill(12.3456789)};
 const reopened=initializeDefaults(restoreState(JSON.parse(JSON.stringify(original))),false,true);
 expect(reopened.decimals).toBe(4);expect(reopened.decimalComma).toBe(decimalComma);expect(reopened.registers).toEqual(original.registers);expect(reopened.program).toEqual(original.program);
 const entered=displayDefaults(pressKey(reopened,'1'));expect(entered.decimals).toBe(4);expect(entered.decimalComma).toBe(decimalComma);expect(original.x).toBe(1.23456789);
});
