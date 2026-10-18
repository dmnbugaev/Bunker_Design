/**
 * Small framework-independent component helpers.
 * The API is DOM-first so it can be adopted by Vue, React or server templates later.
 */

/** @typedef {{ id:string, name:string, category:'devices'|'tobacco', available:boolean, price:string, code:string, image?:string }} Product */

/** @param {Product} product */
export function createProductCard(product) {
  const article = document.createElement('article');
  article.className = 'card product-card';
  article.dataset.category = product.category;
  article.dataset.available = String(product.available);
  article.dataset.name = product.name.toLocaleLowerCase('ru');
  article.innerHTML = `
    <div class="product-card__media ${product.image ? 'product-card__media--photo' : ''}" role="img" aria-label="Изображение: ${escapeHtml(product.name)}">
      ${product.image ? `<img src="${escapeHtml(product.image)}" alt="" loading="lazy" width="640" height="840">` : ''}
      <span class="product-card__code">${escapeHtml(product.code)}</span>
    </div>
    <div class="product-card__body">
      <span class="badge ${product.available ? 'badge--success' : ''}">${product.category === 'devices' ? 'Устройство' : 'Табак'}</span>
      <h3 class="product-card__title">${escapeHtml(product.name)}</h3>
      <span class="product-price">${escapeHtml(product.price)}</span>
      <span class="availability" style="${product.available ? '' : 'color:var(--color-text-muted)'}">${product.available ? 'Есть в выбранном магазине' : 'Уточните наличие'}</span>
      <button class="button button--outline button--sm" type="button">Посмотреть детали</button>
    </div>`;
  return article;
}

/** @param {string} message */
export function showToast(message) {
  const region = document.querySelector('[data-toast-region]');
  if (!region) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  region.append(toast);
  window.setTimeout(() => toast.remove(), 3600);
}

/** @param {string} value */
function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

export function setupTabs() {
  document.querySelectorAll('[role="tablist"]').forEach((tablist) => {
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    const activate = (tab) => {
      tabs.forEach((item) => {
        const selected = item === tab;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
        document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
      });
      tab.focus();
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activate(tab));
      tab.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        activate(tabs[nextIndex]);
      });
    });
  });
}

export function setupDropdowns() {
  document.querySelectorAll('[data-dropdown]').forEach((dropdown) => {
    const trigger = dropdown.querySelector('button');
    trigger.addEventListener('click', () => {
      const open = dropdown.dataset.open !== 'true';
      dropdown.dataset.open = String(open);
      trigger.setAttribute('aria-expanded', String(open));
    });
  });
  document.addEventListener('click', (event) => {
    document.querySelectorAll('[data-dropdown][data-open="true"]').forEach((dropdown) => {
      if (dropdown.contains(event.target)) return;
      dropdown.dataset.open = 'false';
      dropdown.querySelector('button').setAttribute('aria-expanded', 'false');
    });
  });
}

export function setupNavigation() {
  const trigger = document.querySelector('[data-menu-toggle]');
  const nav = document.getElementById('main-nav');
  if (!trigger || !nav) return;
  trigger.addEventListener('click', () => {
    const open = nav.dataset.open !== 'true';
    nav.dataset.open = String(open);
    trigger.setAttribute('aria-expanded', String(open));
    trigger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  });
  nav.addEventListener('click', () => {
    nav.dataset.open = 'false';
    trigger.setAttribute('aria-expanded', 'false');
  });
}

export function setupOverlays() {
  const dialog = document.getElementById('demo-dialog');
  document.querySelector('[data-open-dialog]')?.addEventListener('click', () => dialog?.showModal());
  document.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => dialog?.close()));

  const drawer = document.querySelector('[data-drawer]');
  const overlay = document.querySelector('[data-overlay]');
  const opener = document.querySelector('[data-open-drawer]');
  const close = () => {
    drawer.dataset.open = 'false';
    drawer.setAttribute('aria-hidden', 'true');
    overlay.dataset.open = 'false';
    document.body.classList.remove('is-locked');
    opener?.focus();
  };
  opener?.addEventListener('click', () => {
    drawer.dataset.open = 'true';
    drawer.setAttribute('aria-hidden', 'false');
    overlay.dataset.open = 'true';
    document.body.classList.add('is-locked');
    drawer.querySelector('button')?.focus();
  });
  overlay?.addEventListener('click', close);
  document.querySelector('[data-close-drawer]')?.addEventListener('click', close);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && drawer?.dataset.open === 'true') close();
  });
}
