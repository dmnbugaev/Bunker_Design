import { createProductCard, setupDropdowns, setupNavigation, setupOverlays, setupTabs, showToast } from './components.js';

const products = [
  { id: 'vmate-pro-2', name: 'VooPoo VMATE Pro 2', category: 'devices', available: true, price: 'Стоимость в магазине', code: 'DEV / 001', image: '/referens/bj8RTwsd6fvYS6l7uVJkVX0eRwSpdJELH_FGHCsoJ_S27TfkwuHfMAW3ks0bzJKFKstTGx7ks7dYIE1fWEGom9E6cNgJpA.jpg' },
  { id: 'mook-fwrd', name: 'MOOK FWRD', category: 'devices', available: false, price: 'Стоимость в магазине', code: 'DEV / 002', image: '/referens/KdgepT789v3QVj8Ijj1Phaq2NtXe3p3Cpa290BciARj27z58fwJIbYkiPO0b7RnfAHzoiKTykBSb6W5Q599QFAs5opCUCA.jpg' },
  { id: 'stels', name: 'STELS', category: 'tobacco', available: true, price: 'Стоимость в магазине', code: 'TBC / 014', image: '/referens/0_tzCLV4Z08ZFwYH_txpFFuvyu6uM_FBeudDGE1FOk_tebn5jPr5KBxzvml5jek-RWu-VYMzqX7WeyEBbJLvpYyTJVxbpw.jpg' },
  { id: 'arqa-premium', name: 'ARQA Premium', category: 'tobacco', available: true, price: 'Стоимость в магазине', code: 'TBC / 021', image: '/referens/V-R5cB34rXOs-N1mHgDAY6GfWnXgXToa9Gbyjrvt25tHrKYI7rNJANwShNNY1P3g7b77gg32nT0hZ7A8sm_ZllzeCeQINg.jpg' },
  { id: 'kaos-eclipse', name: 'KAOS Eclipse', category: 'devices', available: true, price: 'Стоимость в магазине', code: 'DEV / 008', image: '/referens/M4Jp7OjTwAmEAwPAaSvjzQbIIaP-YXUz4s8DlZ4uaqQQOxaSb5mZBJ3uIYcepPVamAWAtLvzlOepQejcapQQjSCz.jpg' },
  { id: 'catalog-position', name: 'Позиция каталога', category: 'tobacco', available: false, price: 'Уточнить в магазине', code: 'TBC / 030', image: '/referens/_KY_sRns6H3lJ2nzvPlQ73i2z-f3n7mg11Ggd9kAleT2NaWRmiLzBdKFeRAc3J6rxsHyksvCCRc18x3xbeReSQYI.jpg' }
];

const grid = document.querySelector('[data-product-grid]');
const search = document.getElementById('catalog-search');
const suggestions = document.querySelector('.search__suggestions');
const sort = document.querySelector('[data-sort]');

function renderCatalog() {
  if (!grid) return;
  const activeCategories = [...document.querySelectorAll('[data-filter]:checked')].map((input) => input.value);
  const onlyAvailable = document.querySelector('[data-available]')?.checked;
  const query = search?.value.trim().toLocaleLowerCase('ru') || '';
  const filtered = products
    .filter((product) => activeCategories.includes(product.category))
    .filter((product) => !onlyAvailable || product.available)
    .filter((product) => product.name.toLocaleLowerCase('ru').includes(query))
    .sort((a, b) => sort?.value === 'available' ? Number(b.available) - Number(a.available) : a.name.localeCompare(b.name, 'ru'));

  grid.replaceChildren(...filtered.map(createProductCard));
  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.style.gridColumn = '1 / -1';
    empty.innerHTML = '<h3>Ничего не найдено</h3><p>Измените запрос или снимите часть фильтров.</p>';
    grid.append(empty);
  }
}

function renderSuggestions() {
  if (!suggestions || !search) return;
  const query = search.value.trim().toLocaleLowerCase('ru');
  if (!query) return suggestions.replaceChildren();
  const matches = products.filter((product) => product.name.toLocaleLowerCase('ru').includes(query)).slice(0, 4);
  suggestions.replaceChildren(...matches.map((product) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = product.name;
    button.addEventListener('click', () => { search.value = product.name; suggestions.replaceChildren(); renderCatalog(); });
    item.append(button);
    return item;
  }));
}

function setupHeroDepth() {
  const hero = document.querySelector('[data-hero]');
  const visual = hero?.querySelector('.hero__visual');
  if (!hero || !visual || !matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let frame = 0;
  hero.addEventListener('pointermove', (event) => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const bounds = hero.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
      visual.style.setProperty('--pointer-x', `${(x * 3.2).toFixed(2)}deg`);
      visual.style.setProperty('--pointer-y', `${(y * -2.4).toFixed(2)}deg`);
      hero.style.setProperty('--smoke-shift-x', `${(x * 1.4).toFixed(2)}%`);
      hero.style.setProperty('--smoke-shift-y', `${(y * 1.1).toFixed(2)}%`);
    });
  });
  hero.addEventListener('pointerleave', () => {
    visual.style.setProperty('--pointer-x', '0deg');
    visual.style.setProperty('--pointer-y', '0deg');
    hero.style.setProperty('--smoke-shift-x', '0%');
    hero.style.setProperty('--smoke-shift-y', '0%');
  });
}

document.querySelectorAll('[data-filter], [data-available]').forEach((input) => input.addEventListener('change', renderCatalog));
sort?.addEventListener('change', renderCatalog);
search?.addEventListener('input', () => { renderSuggestions(); renderCatalog(); });
document.querySelector('[data-filter-toggle]')?.addEventListener('click', () => {
  const filters = document.getElementById('catalog-filters');
  filters.dataset.open = String(filters.dataset.open !== 'true');
});
document.querySelector('[data-show-toast]')?.addEventListener('click', () => showToast('Настройки сохранены'));

setupTabs();
setupDropdowns();
setupNavigation();
setupOverlays();
setupHeroDepth();
renderCatalog();
