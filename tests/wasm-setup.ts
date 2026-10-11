import {readFileSync} from 'node:fs';
import {installWasm} from '../packages/core/src/runtime';
if(process.env.HP12C_TEST_ENGINE==='rust')installWasm((await WebAssembly.instantiate(readFileSync(new URL('../packages/core/wasm/hp12c.wasm',import.meta.url)))).instance);
