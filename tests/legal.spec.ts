import { test, expect, type Page } from "@playwright/test";

// Юридические инварианты сайта: возрастной гейт не пропускает контент в
// SSR-HTML, запрещённые категории не публикуются, на страницах каталога нет
// лексики дистанционной продажи и стимулирования, юридические страницы
// доступны без подтверждения возраста.

/** Клик по кнопке подтверждения 18+ после окончания гидрации Vue. */
async function confirmAgeByButton(page: Page) {
  // SSR-разметка отвечает на ассерты и до гидрации, а клик по кнопке
  // AgeNotice теряется, если Vue ещё не подключил обработчики.
  await page.waitForFunction(
    () =>
      (
        document.getElementById("__nuxt") as HTMLElement & {
          __vue_app__?: { $nuxt?: { isHydrating: boolean } };
        }
      )?.__vue_app__?.$nuxt?.isHydrating === false,
    undefined,
    { timeout: 10_000 },
  );
  await page.getByRole("button", { name: "Мне 18 лет или больше" }).click();
}

test("catalog content is absent from server HTML until age is confirmed", async ({
  page,
  request,
}) => {
  const bare = await request.get("/");
  const html = await bare.text();
  expect(html).not.toContain("VooPoo");
  expect(html).not.toContain("product-card");

  // request-фикстура не разделяет cookie контекста — передаём подтверждение
  // возраста заголовком.
  const allowed = await request.get("/", {
    headers: { cookie: "bunker-age-confirmed=true" },
  });
  const allowedHtml = await allowed.text();
  // После 18+ на главной показывается витрина направлений каталога
  // (товарная витрина «Недавно обновлено» убрана 25.10.2026 — карточки
  // товаров живут только в /catalog и карточке товара).
  expect(allowedHtml).toContain("category-tile");
  expect(allowedHtml).toContain("Жидкости");
  await page.context().addCookies([
    {
      name: "bunker-age-confirmed",
      value: "true",
      domain: "127.0.0.1",
      path: "/",
    },
  ]);
  await page.goto("/");
  await expect(page.locator(".category-tile").first()).toBeVisible();
  await expect(page.locator(".product-card")).toHaveCount(0);
});

test("banned and unclassified categories are never published; pouches are published as regulated", async ({
  request,
}) => {
  // Состав каталога (в отличие от общедоступной выдачи) виден только с
  // подтверждением 18+ — передаём его заголовком (request-фикстура не
  // разделяет cookie контекста).
  const headers = { cookie: "bunker-age-confirmed=true" };
  const meta = await (await request.get("/api/catalog/meta")).json();
  const names = meta.categories.map(
    (category: { name: string }) => category.name,
  );
  expect(names).not.toContain("Новая папка");
  // Ароматизаторы (пищевые, для самозамеса) публикуются по подтверждению
  // владельца от 10.10.2026 как нерегулируемый ассортимент.
  expect(names).toContain("Ароматизаторы");
  // Паучи (подтверждено владельцем) публикуются как регулируемая категория.
  expect(names).toContain("Жевательный табак");
  // Сортировка по новизне: 28 позиций не входят в лимит страницы (24),
  // chew-01 (10.10) уверенно попадает в первый лист.
  const list = await (
    await request.get("/api/products?limit=24&available=0&sort=newest", {
      headers,
    })
  ).json();
  // 30 позиций фикстуры минус непубликуемая nbc-01 из корня «Новая папка»
  // (ветка Vape Express добавлена 01.11.2026: fx-vex-vinci + fx-vex-argus).
  expect(list.total).toBe(29);
  const pouch = list.items.find(
    (item: { slug: string }) => item.slug === "chew-01",
  );
  expect(pouch).toBeTruthy();
  // Описания публикуются для всех классов по решению владельца от
  // 10.10.2026 (тексты готовятся в МойСклад самим продавцом).
  expect(pouch.description).toBe("Не публикуется для регулируемого класса.");
  const banned = await request.get("/api/products/nbc-01");
  expect(banned.status()).toBe(404);
});

test("unregulated assortment is reachable before age confirmation; regulated stays gated", async ({
  page,
  request,
}) => {
  // Решение владельца 13.10.2026: напитки, снеки, лапша, китайский чай,
  // ароматизаторы и глицерин видны без подтверждения 18+ и без аккаунта.
  // В фикстуре общедоступны чай (2 позиции, подкатегория «Напитков»),
  // лимонад, снеки (2) и ароматизатор.
  const list = await (await request.get("/api/products?available=0")).json();
  expect(list.total).toBe(6);
  expect(list.items.map((item: { slug: string }) => item.slug).sort()).toEqual([
    "aroma-01",
    "fx-lemonade",
    "fx-snack-noodles",
    "fx-snack-nuts",
    "fx-tea-earl",
    "fx-tea-oolong",
  ]);
  // Регулируемый товар существует, но до подтверждения — 403 (не 404:
  // страница товара показывает блок подтверждения); отсутствующий — 404.
  expect((await request.get("/api/products/fx-vmate-pro-2")).status()).toBe(
    403,
  );
  expect((await request.get("/api/products/missing")).status()).toBe(404);
  expect(
    (
      await request.get("/api/products/fx-vmate-pro-2", {
        headers: { cookie: "bunker-age-confirmed=true" },
      })
    ).status(),
  ).toBe(200);
  // Изображения общедоступных товаров не требуют взрослой сессии в API;
  // прямой URL изображения регулируемого товара закрыт 403.
  const teaPublic = list.items.find(
    (item: { slug: string }) => item.slug === "fx-tea-oolong",
  );
  expect(teaPublic.images.length).toBe(1);
  expect(teaPublic.imagesRestricted).toBeUndefined();
  expect(
    (await request.get("/api/products/fx-vmate-pro-2/images/0")).status(),
  ).toBe(403);

  // Страница каталога рендерится без модального гейта: карточки
  // общедоступных товаров видны, регулируемые не показываются.
  await page.goto("/catalog");
  await expect(
    page.getByRole("dialog", { name: "Вам уже исполнилось 18 лет?" }),
  ).not.toBeVisible();
  await expect(page.locator(".product-card")).toHaveCount(6);
  // Навигация категорий до подтверждения — только общедоступные корни.
  // «Устройства» ищем внутри навигации категорий: слово встречается и в
  // постоянных ссылках шапки/подвала (раздел «Б/у устройства»).
  await expect(
    page.getByRole("navigation", { name: "Категории каталога" }),
  ).toContainText("Напитки");
  await expect(
    page
      .getByRole("navigation", { name: "Категории каталога" })
      .getByText("Устройства"),
  ).toHaveCount(0);
  await expect(page.getByText("Жевательный табак")).toHaveCount(0);
  await expect(page.getByText("MOOK FWRD")).toHaveCount(0);
  // Подтверждение по кнопке на странице открывает полный каталог
  // без перезагрузки.
  await confirmAgeByButton(page);
  await expect(page.getByText("MOOK FWRD").first()).toBeVisible();

  // Карточка общедоступного товара открыта анонимно (с изображением),
  // регулируемого — показывает блок подтверждения, а не 404.
  await page.context().clearCookies({ name: "bunker-age-confirmed" });
  await page.goto("/product/fx-tea-oolong");
  await expect(
    page.getByRole("heading", {
      name: "Китайский чай «Молочный улун», 50 г",
    }),
  ).toBeVisible();
  await expect(page.locator(".product-gallery img").first()).toBeVisible();
  await page.goto("/product/fx-vmate-pro-2");
  await expect(
    page.getByRole("heading", { name: "VooPoo VMATE Pro 2" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("note").getByText("Карточка доступна после"),
  ).toBeVisible();
  await confirmAgeByButton(page);
  // Подтверждение запускает дозагрузку товара — под нагрузкой полного
  // прогона она может выходить за дефолтные 5 секунд.
  await expect(
    page.getByRole("heading", { name: "VooPoo VMATE Pro 2" }),
  ).toBeVisible({ timeout: 15000 });

  // Регулируемая категория до подтверждения — блок 18+ вместо выдачи.
  await page.context().clearCookies({ name: "bunker-age-confirmed" });
  await page.goto("/catalog/cat-liquids");
  await expect(
    page
      .getByRole("note")
      .getByText("Эта часть каталога доступна после подтверждения"),
  ).toBeVisible();
  await expect(page.locator(".product-card")).toHaveCount(0);
});

test("legal pages are reachable without the age gate", async ({ page }) => {
  // 09.10.2026: информационные страницы (/, /about, /stores, /partners)
  // открыты без гейта — как юридические; каталогозависимые секции
  // главной при этом скрыты до подтверждения 18+ (см. seo.spec).
  for (const path of [
    "/privacy",
    "/personal-data",
    "/information",
    "/contacts",
    "/",
    "/about",
    "/stores",
    "/partners",
  ]) {
    await page.goto(path);
    await expect(
      page.getByRole("dialog", { name: "Вам уже исполнилось 18 лет?" }),
    ).not.toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
  await page.goto("/information");
  await expect(page.getByRole("heading", { name: /Продавец/ })).toBeVisible();
  // Реквизиты продавца предоставлены владельцем 26.10.2026 и публикуются
  // на информационной странице (ЗоЗПП ст. 8–10).
  await expect(page.getByText(/ИНН 645332157743/).first()).toBeVisible();
  await expect(
    page
      .getByRole("link", { name: "Политика обработки персональных данных" })
      .first(),
  ).toBeVisible();
});

test("used-devices section is gated and points to Vape Express communities", async ({
  page,
}) => {
  // Раздел «Б/у устройства» (Vape Express) — за модальным гейтом, как
  // /reserve: до подтверждения 18+ контент не отдаётся вовсе.
  await page.goto("/used");
  await expect(
    page.getByRole("dialog", { name: "Вам уже исполнилось 18 лет?" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Б/у устройства." }),
  ).toHaveCount(0);
  await page.context().addCookies([
    {
      name: "bunker-age-confirmed",
      value: "true",
      domain: "127.0.0.1",
      path: "/",
    },
  ]);
  await page.goto("/used");
  await expect(
    page.getByRole("heading", { name: "Б/у устройства." }),
  ).toBeVisible();
  // Ссылки на сообщества Vape Express: ВКонтакте и Telegram, каждая —
  // в новой вкладке без opener.
  const vk = page.getByRole("link", { name: "Vape Express в ВКонтакте" });
  await expect(vk).toHaveAttribute("href", "https://vk.ru/vape.express");
  const telegram = page.getByRole("link", { name: "Vape Express в Telegram" });
  await expect(telegram).toHaveAttribute("href", "https://t.me/VapeExpress");
  for (const link of [vk, telegram]) {
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
  // Витрина комиссии — корень «Vape Express» из каталога: на странице
  // живёт мини-каталог ветки (подпапка «Smoant» + товары).
  await expect(
    page.getByRole("heading", { name: "Каталог б/у устройств" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Smoant" })).toHaveAttribute(
    "href",
    "/catalog/cat-vex-smoant",
  );
  await expect(
    page.getByRole("link", { name: "Открыть весь раздел" }),
  ).toHaveAttribute("href", "/catalog/cat-vex-express");
  await expect(page.locator(".product-card")).not.toHaveCount(0);
  // Раздел доступен из основной навигации шапки.
  await expect(
    page.locator(".desktop-nav").getByRole("link", { name: "Б/у устройства" }),
  ).toBeVisible();
});

test("catalog pages contain no remote-sale or promotion vocabulary", async ({
  page,
}) => {
  await page.context().addCookies([
    {
      name: "bunker-age-confirmed",
      value: "true",
      domain: "127.0.0.1",
      path: "/",
    },
  ]);
  // /reserve включён: список выбранных товаров и запрос на резерв не должны
  // использовать лексику дистанционной продажи. /used — раздел б/у устройств
  // (справочник по сервису Vape Express) под теми же ограничениями лексики.
  for (const path of [
    "/",
    "/catalog",
    "/product/fx-vmate-pro-2",
    "/reserve",
    "/used",
  ]) {
    await page.goto(path);
    const text = await page.locator("body").innerText();
    for (const word of [
      "Купить",
      "В корзину",
      "Заказать",
      "Оформить заказ",
      "Перейти к оплате",
      "Доставк",
      "Скидк",
      "Промокод",
      "Бонус",
      "Подарок за",
      "Успей",
      "Хит",
    ])
      expect(text, `${path}: «${word}»`).not.toContain(word);
  }
});

test("owner home address, adult-shop tagline and MoySklad captions are absent", async ({
  page,
}) => {
  await page.context().addCookies([
    {
      name: "bunker-age-confirmed",
      value: "true",
      domain: "127.0.0.1",
      path: "/",
    },
  ]);
  for (const path of [
    "/",
    "/catalog",
    "/product/fx-vmate-pro-2",
    "/information",
    "/privacy",
    "/personal-data",
    "/about",
    "/stores",
    "/contacts",
    "/partners",
    "/reserve",
    "/used",
    "/login",
    "/register",
  ]) {
    await page.goto(path);
    const text = await page.locator("body").innerText();
    // Домашний адрес владельца не публикуется нигде (решение владельца
    // 08.10.2026); строки «магазин для взрослых 18+» и подписи про МойСклад
    // убраны по требованию заказчика.
    for (const banned of [
      "Васильковская",
      "Васильевская",
      "410039",
      "Магазины для взрослых",
      "магазинов для взрослых",
      "Изображение товара из каталога МойСклад",
      "поступают из МойСклад",
    ])
      expect(text, `${path}: «${banned}»`).not.toContain(banned);
  }
});

test("security headers are present", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();
  expect(headers["content-security-policy"]).toContain("default-src 'self'");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toContain("camera=()");
});
