import {defineConfig} from 'vitest/config';
export default defineConfig({test:{include:['tests/engine.test.ts','tests/hp-panel.test.ts'],environment:'node'}});
