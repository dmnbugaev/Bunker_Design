/**
 * robots.txt — отдаётся Nitro-роутом, чтобы домен Sitemap всегда совпадал
 * с NUXT_PUBLIC_SITE_URL (статический файл протухал при смене домена).
 * Индексируются только информационные страницы; каталог и карточки
 * товаров закрыты от индексации (витрина регулируемой продукции —
 * см. docs/COMPLIANCE.md). robots.txt не используется как защита
 * персональных данных: приватные маршруты дополнительно закрывает
 * meta noindex и серверная авторизация.
 */
import { canonicalSiteUrl } from "~~/shared/seo/site";

export default defineEventHandler((event) => {
  const siteUrl =
    useRuntimeConfig(event).public.siteUrl || "https://bunker.example";
  setResponseHeader(event, "Content-Type", "text/plain; charset=utf-8");
  setResponseHeader(event, "Cache-Control", "public, max-age=3600");
  return `User-agent: *
Disallow: /account
Disallow: /login
Disallow: /register
Disallow: /reserve
Disallow: /search
Disallow: /api/
# Карточки товаров: контент скрыт до подтверждения 18+ — для робота это
# пустая страница, расход обхода; meta noindex и так исключает их из выдачи.
Disallow: /product/

Sitemap: ${canonicalSiteUrl("/sitemap.xml", siteUrl)}
`;
});
