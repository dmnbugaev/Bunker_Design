# AGENTS.md — инструкция для агентов по репозиторию «Бункера»

Сайт сети вейпшопов «Бункер»: Nuxt 4 (Vue 3, TypeScript, Nitro), собственный
CSS по токенам дизайн-системы, без UI-фреймворков. Подробности — в README.md.

## Правовая модель (не нарушать)

Сайт — НЕ интернет-магазин (15-ФЗ ст. 19, дистанционная продажа никотинодержащей
продукции запрещена). Витрина — справочный каталог: цены и наличие, без «купить»
и корзины. Покупка — только запрос на резерв в магазин (`/reserve`). Гейт 18+,
каталог/карточки/поиск — noindex. Юридическая классификация корневых папок
«МойСклад» — `shared/legal/classification.ts`: неклассифицированные папки не
публикуются. При правках каталога/бронирования сверяйтесь с этой моделью.

## Команды

```bash
npm run dev            # dev-сервер, http://127.0.0.1:3000
npm run typecheck      # vue-tsc
npm run lint           # eslint (--max-warnings 0)
npm run format         # prettier --write (check: npm run format:check)
npm run test:unit      # node --test tests/*.test.mjs
npm run test           # e2e Playwright (сам поднимает dev-сервер в фикстурном режиме)
npm run build          # production-сборка (.output/)
npm run catalog:sync   # выгрузка из «МойСклад» + проверка МРЦ
npm run design-kit     # локальная демо-страница дизайн-кита
```

CI (.github/workflows/ci.yml): format:check → lint → typecheck → test:unit →
build. Node 24 (часть unit-тестов тайминг-зависима и на Node 22 даёт ложные
падения). e2e в CI не гоняется.

Аудит вёрстки (отдельный конфиг, по production-сборке):
`npx playwright test -c playwright.audit.config.ts [группа]` — спеки в
`tests/audit/*.audit.ts`, основной конфиг их не подхватывает.

## Режимы данных

- Dev и e2e по умолчанию — **фикстурный режим**:
  `MOYSKLAD_SNAPSHOT_PATH=./tests/fixtures/catalog.json` в `.env`; каталог из
  демо-снимка, бонусы — тестовые ответы. Playwright-конфиг задаёт snapshot
  принудительно, так что e2e всегда герметичен.
- Локально с 21.10.2026 в `.env` вписан живой токен «МойСклад» (см.
  docs/NEEDS-DATA.md); Vercel остаётся на фикстуре. В production snapshot не
  задавать, только `NUXT_MOYSKLAD_TOKEN`.
- Секреты — только серверные (`server/services/moysklad*.ts`), никогда не в
  `NUXT_PUBLIC_*`. Картинки товаров — через серверный прокси
  `/api/products/:id/images/:n`. Полный список переменных — `.env.example`.

## Слои и границы

- `app/` — страницы, компоненты, композиции. UI-кит `app/components/ui/`
  (UiButton, UiDialog, …) — единственный канонический источник компонентов.
  Автоимпорт без pathPrefix: `<UiButton/>`, `<CatalogFilters/>` и т.д. без
  префиксов папок. Стили — `app/assets/css/` в порядке tokens → base →
  components → pages; новые стили — по токенам из tokens.css, не хардкодом.
- `server/` — API-эндпоинты, сервисы «МойСклад» (каталог кешируется на 5 мин,
  `catalog-cache.ts`), файловые хранилища в `.data/`, сессии, rate-limit'ы.
- `shared/` — код общий для клиента и сервера: типы, валидация, юридический
  слой, SEO, контактные данные (`shared/content/bunker.ts`, `legal.ts` —
  там заглушки до данных владельца, паттерн заглушек сохранять).

## Грабли

- **Не переиспользуйте уже поднятый dev-сервер для повторного прогона e2e** —
  rate-limit'ы (auth/reservation) сгорают, спеки сыплются. Поднимайте свежий
  или чистите `test-results/`-каталоги сторов.
- Nitro node-server игнорирует CLI-флаг `--port` — порт задаётся переменной
  `PORT` (см. playwright.audit.config.ts).
- Playwright предустанавливает cookie согласия `bunker-consent` всем контекстам
  (баннер перекрывает клики); поведение баннера тестируется отдельно в
  consent.spec.ts с очищенным стором.
- e2e маскирует Telegram-ключи пустыми строками — dotenv не переопределяет
  существующие переменные, уведомления не уходят в реальный Telegram.
- `design-kit/` (~24 МБ) и `docs/` не деплоятся (`.vercelignore`), design-kit
  исключён из eslint. Не тащите их в сборку.
- Изображения сайта — WebP в `public/images/`, генерируются из design-kit
  (`design-kit/tools/`, напр. `generate-favicon.mjs` для `/brand/*`).

## Деплой

Push в main → Vercel (auto, `vercel.json`; лишнее отрезает `.vercelignore`).
Файловые хранилища на Vercel эфемерны (уходят в /tmp). VPS-деплой через CI
включается переменной `DEPLOY_ENABLED=true` + SSH-секреты.

## Что читать перед правками

- `docs/INTEGRATION.md` — интеграция «МойСклад» (маппинг складов/цен/остатков).
- `docs/NEEDS-DATA.md` — что ещё не предоставлено владельцем (домен, реквизиты,
  контакты, шрифты).
- `docs/design-system/` — токены, компоненты, a11y, адаптив; `design-kit/README.md`.
- `docs/ui-ux-audit.md` — актуальное состояние аудита интерфейса.
