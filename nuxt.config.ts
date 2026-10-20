// Шрифты и изображения — собственные; стили Vue требуют unsafe-inline.
// 'unsafe-inline' для script-src обязателен: Nuxt передаёт состояние SSR
// inline-скриптом (см. docs/COMPLIANCE.md — оценка остаточного риска CSP).
// В dev-режиме Vite нужны 'unsafe-eval' и расширенный connect-src
// (HMR/websocket, dev-манифест; WebKit блокирует часть same-origin
// запросов при строгом 'self').
const isDev = process.env.NODE_ENV === "development";
// Блок «Наши магазины» на /contacts — JS API Яндекс.Карт: сам SDK
// (api-maps.yandex.ru, yastatic.net), тайлы и служебные картинки
// (*.maps.yandex.net, yastatic.net), запросы к сервисам API. Хосты
// дублируются в img-src и connect-src: тайлы рендерятся в canvas,
// часть картинок приходит <img>-элементами.
const yandexMaps = {
  // Часть слоёв тайлов на близком зуме приходит JSONP-скриптами с
  // *.maps.yandex.net, поэтому хост есть и в script-src.
  script:
    " https://api-maps.yandex.ru https://yastatic.net https://yandex.ru https://*.maps.yandex.net",
  // yandex.ru нужен и для картинок: промо-блок карты («Как добраться»,
  // «На такси») отправляет счётчики видимости <img>-пикселями с /clck/.
  // log.api-maps.yandex.ru — служебная телеметрия JS API (watch-пиксель);
  // без него Maps пишет ошибку в консоль на каждый показ карты.
  img: " https://*.maps.yandex.net https://yastatic.net https://api-maps.yandex.ru https://yandex.ru https://log.api-maps.yandex.ru",
  connect:
    " https://api-maps.yandex.ru https://*.maps.yandex.net https://yandex.ru https://log.api-maps.yandex.ru",
};
// Yandex SmartCaptcha (виджет формы запроса на резерв): скрипт виджета,
// iframe и его ресурсы. Серверная проверка токена выполняется на своём
// сервере (smartcaptcha.yandexcloud.net) и CSP страницы не касается.
const smartCaptcha = {
  script: " https://smartcaptcha.ru",
  frame: " https://smartcaptcha.ru",
  img: " https://smartcaptcha.ru",
  connect: " https://smartcaptcha.ru",
};
// Яндекс.Метрика 113582832: скрипт tag.js и отправка данных
// (хиты, Вебвизор, карта кликов) — только mc.yandex.ru, РФ.
const yandexMetrika = {
  script: " https://mc.yandex.ru",
  img: " https://mc.yandex.ru",
  connect: " https://mc.yandex.ru",
};
const contentSecurityPolicy = [
  "default-src 'self'",
  `img-src 'self' data:${yandexMaps.img}${smartCaptcha.img}${yandexMetrika.img}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  `connect-src 'self'${yandexMaps.connect}${smartCaptcha.connect}${yandexMetrika.connect}${isDev ? " ws: http://localhost:* http://127.0.0.1:*" : ""}`,
  `script-src 'self' 'unsafe-inline'${yandexMaps.script}${smartCaptcha.script}${yandexMetrika.script}${isDev ? " 'unsafe-eval'" : ""}`,
  `frame-src 'self'${smartCaptcha.frame}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

export default defineNuxtConfig({
  compatibilityDate: "2026-09-27",
  runtimeConfig: {
    public: {
      // Канонический домен сайта. TODO(данные владельца): домен сети
      // «Бункер» не предоставлен — placeholder обязательно переопределяется
      // переменной NUXT_PUBLIC_SITE_URL (см. docs/NEEDS-DATA.md).
      // Переменная окружения: NUXT_PUBLIC_SITE_URL.
      siteUrl: "https://bunker.example",
      // Яндекс.Метрика: auto — грузить счётчик только в production-сборке
      // на публичном домене; 0 — никогда; 1 — всегда (e2e-проверки
      // интеграции запускаются с 1 и блокируют сеть до mc.yandex.ru).
      // Переменная окружения: NUXT_PUBLIC_METRIKA_ENABLED.
      metrikaEnabled: "auto",
      // Номер счётчика Метрики сети «Бункер». Пустое значение — скрипт
      // Метрики не загружается вовсе.
      // Переменная окружения: NUXT_PUBLIC_METRIKA_COUNTER_ID.
      metrikaCounterId: "",
      // Ключ JS API Яндекс.Карт — публичный (виден в адресе скрипта карты),
      // карта работает и без него (API предупреждает в консоли). Выдаётся
      // бесплатно на developer.tech.yandex.ru; в Git не коммитится.
      // Переменная окружения: NUXT_PUBLIC_YANDEX_MAPS_API_KEY.
      yandexMapsApiKey: "",
      // Публичный клиентский ключ SmartCaptcha (виден в разметке виджета по
      // определению). Серверный ключ SMARTCAPTCHA_SERVER_KEY — только
      // server-side (server/services/smartcaptcha.ts), здесь его нет.
      // Переменная окружения: NUXT_PUBLIC_SMARTCAPTCHA_CLIENT_KEY.
      smartCaptchaClientKey: "",
    },
    moyskladToken: "",
    telegramBotToken: "",
    telegramChatId: "",
  },
  devtools: { enabled: false },
  components: [{ path: "~/components", pathPrefix: false }],
  // Клиентские route rules не используются; манифест убирает шумный
  // dev-fetch /_nuxt/builds/meta/dev.json (WebKit-блокировка в dev).
  experimental: { appManifest: false },
  css: [
    "~/assets/css/tokens.css",
    "~/assets/css/base.css",
    "~/assets/css/components.css",
    "~/assets/css/pages.css",
  ],
  nitro: {
    routeRules: {
      "/**": {
        headers: {
          "Content-Security-Policy": contentSecurityPolicy,
          "X-Frame-Options": "DENY",
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "strict-origin-when-cross-origin",
          "Permissions-Policy":
            // Геолокация нужна только самому сайту — автоподбор
            // ближайшего магазина; сторонним фреймам по-прежнему запрещена.
            "camera=(), microphone=(), geolocation=(self), payment=(), usb=()",
          "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        },
      },
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: "ru" },
      title: "Бункер",
      meta: [
        // Страховочный дефолт: страница без явного robots не попадает в
        // индекс. Индексируемые информационные страницы переопределяют
        // этот мета-тег через usePageSeo({ index: true }).
        { name: "robots", content: "noindex, nofollow" },
        {
          name: "description",
          content:
            "Бункер — сеть вейпшопов: адреса магазинов, режим работы и справочный каталог ассортимента для лиц старше 18 лет.",
        },
      ],
      // Единый фавикон для всех страниц: SVG-мастер (Chrome/Firefox/
      // Edge), PNG 32 для Safari и apple-touch-icon для iOS/закладок.
      // Набор регенерируется: node design-kit/tools/generate-favicon.mjs
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/brand/favicon.svg" },
        { rel: "icon", type: "image/png", sizes: "32x32", href: "/brand/favicon-32.png" },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/brand/apple-touch-icon.png",
        },
      ],
    },
  },
});
