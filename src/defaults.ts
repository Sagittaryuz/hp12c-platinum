import { type CalculatorState } from '@sagittaryuz/hp12c-core';

export const DEFAULT_PROGRAM_VERSION = 'equivalent-rate-v1';
export const DEFAULT_DISPLAY_VERSION = 'user-display-preferences-v3';
// Program demonstrated in https://www.youtube.com/watch?v=8xxCpFUCkPA
// i = source rate (%), n = source period, X = target period; R/S runs it.
// 100 * ((1 + i / 100) ^ (X / n) - 1)
export const DEFAULT_RATE_PROGRAM = [
  'sequence:store,0', 'sequence:recall,i', '1', 'pct', '1', 'plus',
  'sequence:recall,0', 'sequence:recall,n', 'divide', 'pow', '1', 'minus',
  '1', '0', '0', 'multiply', 'goto:000',
];
export function displayDefaults(state:CalculatorState):CalculatorState {
  // Display preferences belong to the saved state, including during key entry.
  return state;
}
export function initializeDefaults(state:CalculatorState, installProgram:boolean, installDisplay=installProgram):CalculatorState {
  const defaults = displayDefaults(state);
  if (!installProgram) return defaults;
  return {...defaults, program:[...DEFAULT_RATE_PROGRAM], programMode:false,
    mode:'RPN', pc:0, programPrefix:[], pendingGoto:null, gotoPosition:false,
    pendingRegister:null, storeOp:null, registerDot:false,
    algOperands:[], algOperators:[], pendingOp:null, running:false, paused:false};
}
