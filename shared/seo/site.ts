/**
 * Единый источник SEO-параметров сайта, общий для клиента и сервера
 * (canonical, sitemap, robots.txt, JSON-LD).
 *
 * TODO(данные владельца): домен сайта «Бункера» не предоставлен —
 * используется технический placeholder, переопределяемый переменной
 * окружения NUXT_PUBLIC_SITE_URL (см. nuxt.config.ts и docs/NEEDS-DATA.md).
 * Пока домен не подтверждён, сайт по умолчанию закрыт от индексации.
 */

/** Домен по умолчанию (placeholder до предоставления владельцем). */
export const SITE_URL = "https://bunker.example";

/**
 * Индексируемые страницы сайта — только информационные и юридические
 * разделы. Каталог, категории, карточки товаров, поиск и служебные
 * страницы в sitemap не входят: содержимое каталога скрывается до
 * подтверждения 18+, а витрина регулируемой продукции с ценами несёт
 * риск квалификации как реклама (38-ФЗ ст. 7; docs/COMPLIANCE.md).
 * Изменение списка — только после юридической оценки.
 */
export const INDEXABLE_ROUTES: readonly string[] = [
  "/",
  "/about",
  "/stores",
  "/contacts",
  "/information",
  "/partners",
  "/privacy",
  "/personal-data",
];

/**
 * Абсолютный URL для метаданных и sitemap. Путь принимается только
 * внутренний и ASCII (латинские slug маршрутов проекта), поисковые/query-
 * часть отсекаются — canonical всегда указывает на чистый путь.
 */
export function canonicalSiteUrl(path: string, baseUrl: string = SITE_URL) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const withoutQuery = (normalized.split("?")[0] ?? normalized).split("#")[0];
  return new URL(withoutQuery ?? normalized, baseUrl).href;
}

/** Хост по произвольному базовому URL (для sitemap/robots). */
export function punycodeHost(baseUrl: string = SITE_URL) {
  return new URL(baseUrl).hostname;
}
