import { readFile, readdir } from 'node:fs/promises';

const required = [
  'assets/styles/tokens.css', 'assets/styles/base.css', 'assets/styles/components.css',
  'assets/js/components.js', 'design-system/index.html', 'docs/design-system/DESIGN_SYSTEM.md'
];
for (const path of required) await readFile(path);

const tokens = await readFile('assets/styles/tokens.css', 'utf8');
const html = await readFile('design-system/index.html', 'utf8');
const requiredTokens = ['--color-brand-primary: #ff5c5c', '--color-brand-background: #1b1b1b', '--color-brand-text: #a8a8a8', '--duration-fast', '--z-modal', '--button-height-md'];
const missing = requiredTokens.filter((token) => !tokens.includes(token));
if (missing.length) throw new Error(`Missing tokens: ${missing.join(', ')}`);
if (!html.includes('name="robots" content="noindex,nofollow"')) throw new Error('Design-system page must stay out of production search navigation');
if (/https?:\/\//.test(html)) throw new Error('Demo must not load remote runtime assets');
const docs = await readdir('docs/design-system');
if (docs.length < 8) throw new Error('Documentation set is incomplete');
console.log(`Validation passed: ${required.length} core files, ${docs.length} documents.`);
