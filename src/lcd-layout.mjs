// Punctuation belongs to its digit; exceptional output must never be truncated.
export function lcdCells(display) {
  const negative = display.startsWith('-');
  // The exponent sign occupies the separator space, leaving ten positions.
  const value = (negative ? display.slice(1) : display).replace(/ (?=-\d{2}$)/,'');
  const cells = [];
  for (const glyph of value) {
    if ((glyph === '.' || glyph === ',') && cells.length && !cells.at(-1).punctuation) cells.at(-1).punctuation = glyph;
    else cells.push({glyph, punctuation:''});
  }
  const segmented = /^[0-9E+\- .,]*$/.test(value) && cells.length <= 10;
  return {negative, segmented, cells:Array.from({length:10}, (_,i) => cells[i] || {glyph:'',punctuation:''})};
}
export function lcdIndicators(state) {
  return [
    ['RPN',state.mode === 'RPN'],['ALG',state.mode === 'ALG'],['( )',state.algOperators.includes('(')],
    ['f',state.shift === 'f'],['g',state.shift === 'g'],['BEGIN',state.tvm.begin],
    ['D.MY',state.dateFormat === 'DMY'],['C',state.compoundOdd],['PRGM',state.programMode],
  ].map(([label, active]) => ({label,active:Boolean(state.powered && active)}));
}
