# Design tokens

Источник истины: `assets/styles/tokens.css`.

## Слои

1. **Primitive** — фактические значения: `--coral-500`, `--neutral-900`, `--space-4`.
2. **Semantic** — роль в интерфейсе: `--color-primary`, `--color-text-secondary`, `--color-error`.
3. **Component** — контракт компонента: `--button-height-md`, `--control-bg`, `--card-border`.

Компонент не должен обращаться к primitive-цвету напрямую, если существует semantic-роль.

## Цвет

Обязательные константы сохранены как `--color-brand-primary`, `--color-brand-background`, `--color-brand-text`. Основной текст использует более светлый `--color-text-primary`, чтобы обеспечить читаемость на тёмном фоне.

Состояния: primary hover/active/subtle, три уровня фона, два уровня surface, две границы, primary/secondary/muted/inverse text, disabled, focus, success, warning, error, info.

## Размеры и геометрия

- базовая единица spacing: 4 px;
- контейнер: максимум 1440 px, адаптивные поля 16–64 px;
- сетка: 12 колонок, gap 16–32 px;
- радиусы: 0, 2, 4, 8, 12 px и pill только для меток/переключателей;
- границы: 1 и 2 px;
- тени рассчитаны для тёмного UI без цветного glow.

## Motion и z-index

- duration: 120 / 220 / 420 ms;
- easing: standard и emphasized;
- reduced motion сводит анимации к 0.01 ms;
- слои: dropdown 100, sticky 200, overlay 300, modal 400, toast 500, tooltip 600.

## Breakpoints

320 / 768 / 1024 / 1280 / 1920 px. CSS написан mobile-first там, где структура начинается с одного столбца, и использует точечные max-width правила для сворачивания существующей desktop-композиции.
