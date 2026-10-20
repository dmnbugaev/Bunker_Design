import assert from "node:assert/strict";
import { after, test } from "node:test";
import process from "node:process";
import { URL } from "node:url";
import { createJiti } from "jiti";

// Имена доп. полей читаются модулем при импорте; состав скрытых складов и
// порядок типов цен — при каждом запросе (задаются env под аккаунт Бункера).
process.env.NUXT_MOYSKLAD_TOKEN = "test-token";
process.env.MOYSKLAD_INTERNAL_STORES = "Склад витрины";
process.env.MOYSKLAD_INTERNAL_STORE_PREFIXES = "РЦ";
process.env.MOYSKLAD_PRICE_TYPES = "Розничная,Москва";

const { fetchCatalog, fetchStock } = await createJiti(import.meta.url).import(
  "../server/services/moysklad.ts",
);
const originalFetch = globalThis.fetch;
const Response = globalThis.Response;
after(() => {
  globalThis.fetch = originalFetch;
});

const collection = (rows) => ({ meta: { size: rows.length }, rows });
const liquidFolder = { id: "folder-liq", name: "Жидкости" };
const deviceFolder = { id: "folder-devices", name: "Устройства" };
const drinksFolder = { id: "folder-drinks", name: "Напитки" };
const nbcFolder = { id: "folder-nbc", name: "НБС" };
const reference = (id) => ({
  meta: {
    href: `https://api.moysklad.ru/api/remap/1.2/entity/productfolder/${id}`,
  },
});
const price = (name, value) => ({ priceType: { name }, value });
const stores = [
  {
    id: "store-1",
    name: "Центральный",
    pathName: "Саратов",
    address: "ул. Примерная, 1",
  },
  { id: "store-2", name: "Энгельсский", pathName: "Энгельс" },
  { id: "store-3", name: "Склад без группы" },
  { id: "rc-1", name: "РЦ Саратов", pathName: "Саратов" },
  { id: "vitrina", name: "Склад витрины", pathName: "Саратов" },
  {
    id: "archived-1",
    name: "Старый склад",
    pathName: "Саратов",
    archived: true,
  },
];
const products = [
  {
    id: "product-1",
    name: "Жидкость тестовая",
    archived: false,
    description: "Вкус мятный.",
    productFolder: reference("folder-liq"),
    salePrices: [price("Розничная", 120000), price("Москва", 140000)],
    attributes: [
      { name: "Показать на сайте", value: true },
      { name: "Название для сайта", value: "  Жидкость Бункер Классическая  " },
    ],
  },
  {
    id: "product-2",
    name: "Скрытая жидкость",
    archived: false,
    productFolder: reference("folder-liq"),
    salePrices: [price("Розничная", 90000)],
    attributes: [{ name: "Показать на сайте", value: false }],
  },
  {
    id: "product-3",
    name: "Жидкость без цены",
    archived: false,
    productFolder: reference("folder-liq"),
    salePrices: [price("Розничная", 0)],
    attributes: [{ name: "Показать на сайте", value: true }],
  },
  {
    id: "product-4",
    name: "Устройство тестовое",
    archived: false,
    description: "Комплект: устройство, кабель.",
    productFolder: reference("folder-devices"),
    salePrices: [price("Розничная", 0), price("Москва", 900000)],
    attributes: [{ name: "Показать на сайте", value: true }],
  },
  {
    id: "product-5",
    name: "Чай китайский",
    archived: false,
    productFolder: reference("folder-drinks"),
    salePrices: [price("Розничная", 1900)],
    attributes: [{ name: "Показать на сайте", value: true }],
  },
  {
    id: "product-6",
    name: "НБС тестовый",
    archived: false,
    productFolder: reference("folder-nbc"),
    salePrices: [price("Розничная", 30000)],
    attributes: [{ name: "Показать на сайте", value: true }],
  },
];
let hasPublishField = true;
globalThis.fetch = async (input) => {
  const path = new URL(String(input)).pathname;
  const rows = path.endsWith("/entity/store")
    ? stores
    : path.endsWith("/entity/productfolder")
      ? [liquidFolder, deviceFolder, drinksFolder, nbcFolder]
      : path.endsWith("/entity/product")
        ? products
        : path.endsWith("/entity/product/metadata/attributes")
          ? [
              ...(hasPublishField
                ? [
                    {
                      id: "visible-field",
                      name: "Показать на сайте",
                      type: "boolean",
                    },
                  ]
                : []),
              {
                id: "site-name-field",
                name: "Название для сайта",
                type: "string",
              },
            ]
          : path.endsWith("/report/stock/bystore")
            ? [
                {
                  meta: {
                    href: "https://api.moysklad.ru/api/remap/1.2/entity/product/product-1",
                  },
                  stockByStore: [
                    {
                      meta: {
                        href: "https://api.moysklad.ru/api/remap/1.2/entity/store/store-1",
                      },
                      stock: 4,
                      reserve: 2,
                    },
                    {
                      meta: {
                        href: "https://api.moysklad.ru/api/remap/1.2/entity/store/store-2",
                      },
                      stock: 1,
                      reserve: 1,
                    },
                    // Ответ без метаданных: уникальное имя склада работает.
                    { name: "Склад без группы", stock: 7 },
                    // Имя вне снимка каталога надёжно игнорируется.
                    { name: "Неизвестный склад", stock: 100 },
                  ],
                },
              ]
            : [];
  return new Response(JSON.stringify(collection(rows)), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

test("publish/site-name fields, price types, city groups and legal policy", async () => {
  const snapshot = await fetchCatalog();
  assert.deepEqual(snapshot.products.map((product) => product.name).sort(), [
    "Жидкость Бункер Классическая",
    "Устройство тестовое",
    "Чай китайский",
  ]);
  const liquid = snapshot.products.find(
    (product) => product.id === "product-1",
  );
  // «Название для сайта» обрезается по краям и заменяет учётное имя.
  assert.equal(liquid.name, "Жидкость Бункер Классическая");
  // Само поле «Название для сайта» не попадает в публичные характеристики.
  assert.equal(
    liquid.attributes.some(
      (attribute) => attribute.name === "Название для сайта",
    ),
    false,
  );
  assert.equal(liquid.legalClass, "REGULATED_NICOTINE");
  assert.equal(liquid.description, "Вкус мятный.");
  // Единица цены единая для всего каталога (особый случай чая за грамм
  // принадлежал ProHook и не переносится).
  assert.equal(liquid.unit, "1 шт");
  // Типы цен из MOYSKLAD_PRICE_TYPES: у товара есть «Розничная» — она и
  // используется для всех магазинов, «Москва» не подмешивается.
  assert.equal(liquid.offers.length, 3);
  assert.ok(liquid.offers.every((offer) => offer.price === 120000));
  const device = snapshot.products.find(
    (product) => product.id === "product-4",
  );
  // «Розничной» нет — берётся следующий тип из списка («Москва»).
  assert.ok(device.offers.every((offer) => offer.price === 900000));
  assert.equal(device.legalClass, "REGULATED_DEVICE");
  const tea = snapshot.products.find((product) => product.id === "product-5");
  assert.equal(tea.unit, "1 шт");
  assert.equal(
    tea.offers.every((offer) => offer.price === 1900),
    true,
  );
  // Города собираются из групп складов (pathName) транслитерацией; склад
  // без группы попадает в «Магазины».
  assert.deepEqual(snapshot.meta.cities.map((city) => city.id).sort(), [
    "engels",
    "saratov",
    "stores",
  ]);
  assert.equal(
    snapshot.meta.stores.find((store) => store.id === "store-1")?.cityId,
    "saratov",
  );
  assert.equal(
    snapshot.meta.stores.find((store) => store.id === "store-2")?.cityId,
    "engels",
  );
  // Служебные склады (env-имена и префиксы) и архивные не публикуются.
  assert.equal(snapshot.meta.stores.length, 3);
  assert.ok(!snapshot.meta.stores.some((store) => store.name === "РЦ Саратов"));
  assert.ok(
    !snapshot.meta.stores.some((store) => store.name === "Склад витрины"),
  );
  // Адрес берётся из «МойСклад», когда локальное обогащение не заполнено.
  assert.equal(
    snapshot.meta.stores.find((store) => store.id === "store-1")?.address,
    "ул. Примерная, 1",
  );
  // Неклассифицированный корень (НБС) скрыт вместе с товарами.
  assert.ok(
    !snapshot.meta.categories.some((category) => category.name === "НБС"),
  );
  assert.ok(!snapshot.products.some((product) => product.id === "product-6"));
});

test("without the publish field all priced active products are included", async () => {
  hasPublishField = false;
  try {
    const snapshot = await fetchCatalog();
    assert.deepEqual(snapshot.products.map((product) => product.name).sort(), [
      "Жидкость Бункер Классическая",
      "Скрытая жидкость",
      "Устройство тестовое",
      "Чай китайский",
    ]);
  } finally {
    hasPublishField = true;
  }
});

test("price fallback without MOYSKLAD_PRICE_TYPES uses first nonzero type", async () => {
  const saved = process.env.MOYSKLAD_PRICE_TYPES;
  delete process.env.MOYSKLAD_PRICE_TYPES;
  try {
    const snapshot = await fetchCatalog();
    const device = snapshot.products.find(
      (product) => product.id === "product-4",
    );
    // Первый ненулевой тип самого товара — «Москва».
    assert.ok(device.offers.every((offer) => offer.price === 900000));
  } finally {
    if (saved) process.env.MOYSKLAD_PRICE_TYPES = saved;
  }
});

test("stock uses warehouse IDs despite renamed or duplicate accounting names", async () => {
  const snapshot = await fetchCatalog();
  const mockedFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify(
        collection([
          {
            meta: {
              href: "https://api.moysklad.ru/api/remap/1.2/entity/product/product-1",
            },
            stockByStore: [
              {
                meta: {
                  href: "https://api.moysklad.ru/api/remap/1.2/entity/store/store-1?expand=foo",
                },
                name: "Старое имя",
                stock: 7,
                reserve: 2,
              },
              {
                meta: {
                  href: "https://api.moysklad.ru/api/remap/1.2/entity/store/store-2",
                },
                stock: 3,
                reserve: 1,
              },
              // Служебный склад, отсутствующий в снимке: остаток игнорируется.
              {
                meta: {
                  href: "https://api.moysklad.ru/api/remap/1.2/entity/store/rc-1",
                },
                stock: 100,
              },
              { name: "Неуникальное имя", stock: 100 },
            ],
          },
        ]),
      ),
    );
  try {
    const stocked = await fetchStock(snapshot);
    const offers = stocked.products.find(
      (product) => product.id === "product-1",
    ).offers;
    // 7−2=5 → «Много»; 3−1=2 → «В наличии»; без записи → «Нет».
    assert.equal(
      offers.find((offer) => offer.storeId === "store-1").availability,
      "plenty",
    );
    assert.equal(
      offers.find((offer) => offer.storeId === "store-2").availability,
      "available",
    );
    assert.equal(
      offers.find((offer) => offer.storeId === "store-3").availability,
      "unavailable",
    );
    // Точные остатки для проверки запросов на резерв: server-only.
    assert.equal(stocked.stockDetail["product-1"]["store-1"], 5);
    assert.equal(stocked.stockDetail["product-1"]["store-2"], 2);
  } finally {
    globalThis.fetch = mockedFetch;
  }
});

test("stock thresholds and name-only fallback entries", async () => {
  const snapshot = await fetchCatalog();
  const stocked = await fetchStock(snapshot);
  const offers = stocked.products.find(
    (product) => product.id === "product-1",
  ).offers;
  // 4−2=2 → «В наличии»; 1−1=0 → «Нет в наличии»; 7 по имени → «Много».
  assert.equal(
    offers.find((offer) => offer.storeId === "store-1").availability,
    "available",
  );
  assert.equal(
    offers.find((offer) => offer.storeId === "store-2").availability,
    "unavailable",
  );
  assert.equal(
    offers.find((offer) => offer.storeId === "store-3").availability,
    "plenty",
  );
  assert.equal(stocked.stockDetail["product-1"]["store-1"], 2);
  assert.equal(stocked.stockDetail["product-1"]["store-2"], 0);
  assert.equal(stocked.stockDetail["product-1"]["store-3"], 7);
});
