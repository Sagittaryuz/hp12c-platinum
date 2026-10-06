import {defineConfig} from 'vitest/config';
export default defineConfig({test:{include:['tests/engine.test.ts','tests/hp-panel.test.ts','tests/history-board.test.ts','tests/surface-pull.test.ts','tests/backup-activity.test.ts','tests/panel-motion.test.ts'],environment:'node'}});
