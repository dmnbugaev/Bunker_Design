# Компоненты

## Общий контракт

В нативной реализации API задаётся классами, `data-*` атрибутами и ARIA. В будущем он может быть обёрнут в Vue-компоненты без смены токенов.

### Button

- variants: `primary`, `secondary`, `outline`, `ghost`, `destructive`, `icon`;
- sizes: `sm`, default, `lg`;
- states: hover, active, focus-visible, disabled, `data-loading=true`;
- icon-only требует `aria-label`.

### Form controls

`.field` связывает label, control, hint/error. Реализованы text, password, search, number, phone, textarea, select, checkbox, radio и switch. Ошибка задаётся `aria-invalid=true` и `aria-describedby`.

### Navigation

Header, desktop/mobile navigation, breadcrumbs, tabs, dropdown и pagination. Tabs поддерживают стрелки, Home и End. Mobile navigation сообщает состояние через `aria-expanded`.

### Feedback

Badge, chip, alert, toast, spinner, skeleton, empty/error/loading states и divider. Toast живёт в polite live-region; ошибка — `role=alert`.

### Overlay

Modal использует нативный `<dialog>` с фокусом и Escape. Drawer синхронизирует backdrop, блокировку body, `aria-hidden`, возврат фокуса и Escape. Tooltip доступен по hover и keyboard focus.

### Cards и каталог

Card, CategoryCard, ProductCard, ProductGrid, ProductPrice, ProductAvailability, условный ProductImage, ProductFilters, ProductSorting, SearchBar/SearchSuggestions, CatalogToolbar и ProductCharacteristics. Превью не содержит checkout и кнопки покупки.

ProductCard API:

```js
createProductCard({
  id, name,
  category: 'devices' | 'tobacco',
  available: true,
  price: 'Стоимость в магазине',
  code: 'DEV / 001'
})
```

### Layout

Container, section heading, typography utilities, 12-column tokenized grid and card primitives. Hero, contact/store cards и product gallery должны добавляться при появлении реальных страниц и данных; не следует создавать их без продуктового сценария.
