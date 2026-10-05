import {test} from 'node:test';
import assert from 'node:assert/strict';
import {lcdCells,lcdIndicators} from '../src/lcd-layout.mjs';

test('dez posições, pontuação sem posição e sinal em coluna separada',()=>{
  const value=lcdCells('-1.234,567890');
  assert.equal(value.negative,true);
  assert.equal(value.segmented,true);
  assert.equal(value.cells.length,10);
  assert.equal(value.cells.map(c=>c.glyph).join(''),'1234567890');
  assert.equal(value.cells[0].punctuation,'.');
  assert.equal(value.cells[3].punctuation,',');
});
test('entrada, zeros e notação científica são preservados',()=>{
  assert.equal(lcdCells('0,0000000').cells.filter(c=>c.glyph).length,8);
  assert.equal(lcdCells('12,00').cells.map(c=>c.glyph).join(''),'1200');
  const sci=lcdCells('-1,234567 -09');
  assert.equal(sci.segmented,true);
  assert.equal(sci.cells[7].glyph,'-');
  assert.equal(lcdCells('1,234567 09').segmented,true);
  assert.equal(lcdCells('2 E-3').segmented,true);
  assert.equal(lcdCells('Error 0').segmented,false);
  assert.equal(lcdCells('12345678901').segmented,false);
});
test('indicadores mantêm todas as posições e refletem somente estados reais',()=>{
  const state={powered:true,mode:'RPN',algOperators:[],shift:null,tvm:{begin:false},dateFormat:'MDY',compoundOdd:false,programMode:false};
  const labels=['RPN','ALG','( )','f','g','BEGIN','D.MY','C','PRGM'];
  assert.deepEqual(lcdIndicators(state).map(i=>i.label),labels);
  assert.deepEqual(lcdIndicators(state).filter(i=>i.active).map(i=>i.label),['RPN']);
  assert.deepEqual(lcdIndicators({...state,mode:'ALG',algOperators:['('],shift:'g',tvm:{begin:true},dateFormat:'DMY',compoundOdd:true,programMode:true}).filter(i=>i.active).map(i=>i.label),['ALG','( )','g','BEGIN','D.MY','C','PRGM']);
  assert.equal(lcdIndicators({...state,powered:false}).some(i=>i.active),false);
});
