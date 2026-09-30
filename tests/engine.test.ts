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
  it('ALG usa precedência e parênteses',()=>{
    let s=pressAction(start(),'modeAlg');s=keys(s,'2','plus','3','multiply','4','enter');expect(s.x).toBe(14);
    s=pressAction(start(),'modeAlg');s=pressAction(s,'parenOpen');s=keys(s,'2','plus','3');s=pressAction(s,'parenClose');s=keys(s,'multiply','4','enter');expect(s.x).toBe(20);
  });
  it('guarda e recupera registradores estendidos, inclusive aritmética',()=>{
    let s=keys(start(),'4','2','sto','decimal','5');expect(s.registers[15]).toBe(42);
    s=keys(s,'2','sto','plus','decimal','5');expect(s.registers[15]).toBe(44);
    s=keys(s,'rcl','decimal','5');expect(s.x).toBe(44);
    expect(restoreState(JSON.parse(JSON.stringify(s))).registers[15]).toBe(44);
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
    let s=keys(start(),'f','rs','sto','decimal','5','2','sto','plus','decimal','5','rcl','decimal','5','rs','f','rs');
    expect(s.program).toEqual(['sequence:store,decimal,5','2','sequence:store,plus,decimal,5','sequence:recall,decimal,5','runStop']);
    s=number(s,'7');s=pressKey(s,'sst');expect(s.registers[15]).toBe(7);expect(s.pc).toBe(1);
    s=pressKey(s,'rs');expect(s.x).toBe(9);expect(s.registers[15]).toBe(9);
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
  it('tem 39 teclas e todo comando listado possui implementação',()=>{
    expect(KEY_DEFINITIONS).toHaveLength(39);
    const actions=new Set(KEY_DEFINITIONS.flatMap(k=>[k.action,k.fAction,k.gAction]).filter(Boolean));
    for(const action of actions){const s=pressAction(start(),action);expect(s.error||'').not.toContain('desconhecida');}
  });
});
