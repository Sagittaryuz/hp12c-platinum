import {spawnSync} from 'node:child_process';
const run=spawnSync(process.execPath,['node_modules/vitest/vitest.mjs','run'],{stdio:'inherit',env:{...process.env,HP12C_TEST_ENGINE:'rust'}});
process.exit(run.status||0);
