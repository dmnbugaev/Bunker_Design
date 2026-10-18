import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const tokens = await readFile('assets/styles/tokens.css', 'utf8');
const components = await readFile('assets/styles/components.css', 'utf8');
const page = await readFile('design-system/index.html', 'utf8');

test('brand constants match the approved palette', () => {
  assert.match(tokens, /--color-brand-primary:\s*#ff5c5c/i);
  assert.match(tokens, /--color-brand-background:\s*#1b1b1b/i);
  assert.match(tokens, /--color-brand-text:\s*#a8a8a8/i);
});

test('token architecture includes primitive, semantic and component layers', () => {
  for (const token of ['--coral-500', '--color-text-primary', '--button-height-md']) assert.ok(tokens.includes(token));
});

test('required component families are represented by real styles', () => {
  for (const selector of ['.button', '.input', '.tabs', '.dialog', '.drawer', '.product-card', '.catalog-toolbar', '.toast', '.skeleton']) assert.ok(components.includes(selector), selector);
});

test('showcase has semantic landmarks and accessibility metadata', () => {
  for (const fragment of ['<header', '<main', '<footer', 'skip-link', 'aria-live="polite"', 'prefers-reduced-motion']) {
    assert.ok(page.includes(fragment) || tokens.includes(fragment) || components.includes(fragment), fragment);
  }
});

test('showcase is intentionally excluded from indexing', () => {
  assert.match(page, /noindex,nofollow/);
});
