import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const out = new URL('../dist/', import.meta.url);
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await Promise.all([
  cp(new URL('../assets/', import.meta.url), new URL('./assets/', out), { recursive: true }),
  cp(new URL('../design-system/', import.meta.url), new URL('./design-system/', out), { recursive: true }),
  cp(new URL('../docs/', import.meta.url), new URL('./docs/', out), { recursive: true }),
  cp(new URL('../referens/', import.meta.url), new URL('./referens/', out), { recursive: true })
]);
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
await writeFile(new URL('./index.html', out), index);
console.log('Build complete: dist/');
