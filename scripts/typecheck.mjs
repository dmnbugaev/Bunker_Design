import { spawnSync } from 'node:child_process';

const files = ['assets/js/components.js', 'assets/js/design-system.js', 'scripts/serve.mjs', 'scripts/build.mjs', 'scripts/validate.mjs'];
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(`Syntax check passed: ${files.length} modules.`);
