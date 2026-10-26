/**
 * Генератор фикстурного каталога Бункера (tests/fixtures/catalog.json).
 *
 * Фикстура используется в двух режимах (обе ветки исключают обращения к
 * живому «МойСклад»):
 *  - e2e-тесты Playwright (MOYSKLAD_SNAPSHOT_PATH в playwright.config.ts);
 *  - локальная разработка без токена: `cp .env.example .env` уже включает
 *    MOYSKLAD_SNAPSHOT_PATH=./tests/fixtures/catalog.json.
 *
 * Изображения ссылаются на постеры из public/images/ (сжатые WebP,
 * сгенерированы из дизайн-кита: node design-kit/tools/optimize-images.mjs);
 * у позиций без фото поле images пустое — карточка показывает заглушку.
 */
import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const cities = [
  { id: "saratov", name: "Саратов" },
  { id: "engels", name: "Энгельс" },
];

// Точки фикстуры повторяют реальную сеть Бункера: 17 адресов из списка
// владелицы 24.10.2026 (те же имена и адреса, что в server/data/
// store-names.ts и store-addresses.ts для живого «МойСклад»). id store-b*
// синтетические и стабильные: на них завязаны стоки демо-ассортимента и
// e2e-спеки. Координаты — приблизительные (район улицы, до геокодирования
// владельцем через npm run stores:geocode), чтобы демо-карта была живой.
const stores = [
  // Саратов — 15 точек
  {
    id: "store-b1",
    cityId: "saratov",
    name: "Рахова, 64/70а",
    description: "Магазин сети Бункер",
    address: "ул. Рахова, 64/70а",
    hours: "Ежедневно, 8:00–01:00",
    coordinates: [46.0205, 51.532],
  },
  {
    id: "store-b2",
    cityId: "saratov",
    name: "Танкистов, 64",
    description: "Магазин сети Бункер",
    address: "ул. Танкистов, 64",
    hours: "Ежедневно, 8:00–01:00",
    coordinates: [45.979, 51.548],
  },
  {
    id: "store-b4",
    cityId: "saratov",
    name: "2-я Садовая, 4",
    description: "Магазин сети Бункер",
    address: "2-я Садовая ул., 4",
    hours: "Ежедневно, 8:00–01:00",
    coordinates: [46.032, 51.5295],
  },
  {
    id: "store-b5",
    cityId: "saratov",
    name: "Вавилова, 9",
    description: "Магазин сети Бункер",
    address: "ул. имени Н.И. Вавилова, 9",
    hours: "Ежедневно, 8:00–01:00",
    coordinates: [46.01, 51.518],
  },
  {
    id: "store-b6",
    cityId: "saratov",
    name: "Чапаева, 60/64",
    description: "Магазин сети Бункер",
    address: "ул. имени В.И. Чапаева, 60/64",
    hours: "Ежедневно, 8:00–01:00",
    coordinates: [46.018, 51.523],
  },
  {
    id: "store-b7",
    cityId: "saratov",
    name: "Огородная, 149",
    description: "Магазин сети Бункер",
    address: "ул. Огородная, 149",
    hours: "Ежедневно, 8:00–01:00",
    coordinates: [45.995, 51.488],
  },
  {
    id: "store-b8",
    cityId: "saratov",
    name: "Техническая, 5",
    description: "Магазин сети Бункер",
    address: "ул. Техническая, 5",
    hours: "Ежедневно, 8:00–01:00",
    coordinates: [46.045, 51.549],
  },
  {
    id: "store-b9",
    cityId: "saratov",
    name: "Тархова, 27",
    description: "Магазин сети Бункер",
    address: "ул. имени С.Ф. Тархова, 27",
    hours: "Ежедневно, 8:00–01:00",
    coordinates: [45.995, 51.556],
  },
  {
    id: "store-b10",
    cityId: "saratov",
    name: "Колхозная площадь, 1А",
    description: "Магазин сети Бункер",
    address: "Колхозная площадь, 1А",
    hours: "Ежедневно, 8:00–01:00",
    coordinates: [46.0085, 51.5219],
  },
  {
    id: "store-b11",
    cityId: "saratov",
    name: "Ново-Астраханское шоссе, 107Гс1",
    description: "Магазин сети Бункер",
    address: "Ново-Астраханское шоссе, 107Гс1",
    hours: "Ежедневно, 8:00–01:00",
    coordinates: [45.96, 51.47],
  },
  {
    id: "store-b12",
    cityId: "saratov",
    name: "Горького, 30",
    description: "Магазин сети Бункер",
    address: "ул. имени А.М. Горького, 30",
    hours: "Ежедневно, 8:00–01:00",
    coordinates: [46.025, 51.53],
  },
  {
    id: "store-b13",
    cityId: "saratov",
    name: "Вольская, 21/27",
    description: "Магазин сети Бункер",
    address: "ул. Вольская, 21/27",
    hours: "Ежедневно, 8:00–01:00",
    coordinates: [45.992, 51.559],
  },
  {
    id: "store-b14",
    cityId: "saratov",
    name: "Ипподромная, 9",
    description: "Магазин сети Бункер",
    address: "ул. Ипподромная, 9",
    hours: "Ежедневно, 8:00–01:00",
    coordinates: [45.965, 51.537],
  },
  {
    id: "store-b15",
    cityId: "saratov",
    name: "Вольская, 44",
    description: "Магазин сети Бункер",
    address: "ул. Вольская, 44",
    hours: "Ежедневно, 8:00–01:00",
    coordinates: [45.984, 51.563],
  },
  {
    id: "store-b16",
    cityId: "saratov",
    name: "Семёнова, 9",
    description: "Магазин сети Бункер",
    address: "ул. имени Академика Н.Н. Семёнова, 9",
    hours: "Ежедневно, 8:00–01:00",
    coordinates: [45.974, 51.541],
  },
  // Энгельс — 2 точки
  {
    id: "store-b3",
    cityId: "engels",
    name: "Фридриха Энгельса, 4",
    description: "Магазин сети Бункер",
    address: "проспект Фридриха Энгельса, 4",
    hours: "Ежедневно, 8:00–01:00",
    coordinates: [46.121, 51.482],
  },
  {
    id: "store-b17",
    cityId: "engels",
    name: "Чапаева, 45",
    description: "Магазин сети Бункер",
    address: "ул. Чапаева, 45",
    hours: "Ежедневно, 8:00–01:00",
    coordinates: [46.113, 51.489],
  },
];

// Корневые категории: имена должны совпадать с ключами легальной
// классификации (shared/legal/classification.ts, регистр не важен).
// «Новая папка» не входит в классификацию — такие корни не публикуются
// (PENDING_REVIEW): позиция nbc-01 служит проверкой этого инварианта.
// «Чай» — подкатегория «Напитков» (проверка навигации по подкатегориям).
const categories = [
  { id: "cat-devices", name: "Устройства", parentId: null },
  { id: "cat-disposables", name: "Одноразовые ЭС", parentId: null },
  { id: "cat-liquids", name: "Жидкости", parentId: null },
  { id: "cat-drinks", name: "Напитки", parentId: null },
  { id: "cat-tea", name: "Чай", parentId: "cat-drinks" },
  { id: "cat-snacks", name: "Снеки", parentId: null },
  { id: "cat-flavors", name: "Ароматизаторы", parentId: null },
  { id: "cat-pouches", name: "Жевательный табак", parentId: null },
  { id: "cat-nbs", name: "Новая папка", parentId: null },
].map((category) => ({
  ...category,
  slug: category.id,
  description: `Товары категории «${category.name}».`,
}));

const IMG = {
  vmate: "/images/fx-vmate.webp",
  mook: "/images/fx-mook.webp",
  kaos: "/images/fx-kaos.webp",
  pod: "/images/fx-pod.webp",
  stels: "/images/fx-stels.webp",
  arqa: "/images/fx-arqa.webp",
  liquid1: "/images/fx-liquid-1.webp",
  liquid2: "/images/fx-liquid-2.webp",
  tea: "/images/fx-tea.webp",
};

/**
 * Демо-ассортимент фикстуры. availability считается из stockDetail.
 * priceByStore (копейки) моделирует разные цены по городам — как в живом
 * «МойСклад»; publishedAt задаёт порядок сортировки «Новинки».
 */
const products = [
  {
    id: "fx-vmate-pro-2",
    name: "VooPoo VMATE Pro 2",
    categoryId: "cat-devices",
    sku: "DEV-001",
    price: 349000,
    priceByStore: { "store-b3": 359000 },
    stock: { "store-b1": 5, "store-b2": 0, "store-b3": 2 },
    images: [IMG.vmate],
    publishedAt: "2026-10-19T09:00:00Z",
    description:
      "Компактное устройство со сменными картриджами, регулировкой затяжки и зарядкой Type-C.\n\nСовместимость: картриджи VMATE серии Pro.",
    attributes: [
      { code: "attr-type", name: "Тип", value: "Стартовый набор" },
      { code: "attr-battery", name: "Аккумулятор", value: "1200 мА·ч" },
    ],
  },
  {
    id: "fx-mook-fwrd",
    name: "MOOK FWRD",
    categoryId: "cat-devices",
    sku: "DEV-002",
    price: 299000,
    stock: { "store-b1": 0, "store-b2": 4, "store-b3": 1 },
    images: [IMG.mook],
    publishedAt: "2026-10-18T09:00:00Z",
    description: "Набор с стиками и устройством нагревания из стартовой серии.",
    attributes: [
      { code: "attr-type", name: "Тип", value: "Набор" },
      { code: "attr-color", name: "Цвет", value: "Чёрный" },
    ],
  },
  {
    id: "fx-kaos-eclipse",
    name: "KAOS Eclipse",
    categoryId: "cat-devices",
    sku: "DEV-003",
    price: 259000,
    stock: { "store-b1": 2, "store-b2": 2, "store-b3": 0 },
    images: [IMG.kaos],
    publishedAt: "2026-10-12T09:00:00Z",
    description: "Устройство с защитой от перегрева и индикацией заряда.",
    attributes: [{ code: "attr-type", name: "Тип", value: "Устройство" }],
  },
  {
    id: "fx-pod-classic",
    name: "Pod-система Bunker Classic",
    categoryId: "cat-devices",
    sku: "DEV-004",
    price: 199000,
    stock: { "store-b1": 1, "store-b2": 0, "store-b3": 6 },
    images: [IMG.pod],
    publishedAt: "2026-10-11T09:00:00Z",
    description: "Базовая pod-система сети: активация затяжкой, картридж 2 мл.",
    attributes: [
      { code: "attr-type", name: "Тип", value: "Pod-система" },
      { code: "attr-color", name: "Цвет", value: "Графит" },
    ],
  },
  {
    id: "fx-stels-6000",
    name: "STELS 6000",
    categoryId: "cat-disposables",
    sku: "ODN-014",
    price: 149000,
    stock: { "store-b1": 10, "store-b2": 3, "store-b3": 0 },
    images: [IMG.stels],
    publishedAt: "2026-10-10T09:00:00Z",
    description: "Одноразовое устройство, 6000 затяжек.",
    attributes: [
      { code: "attr-taste", name: "Вкус", value: "Ягодный микс" },
      { code: "attr-power", name: "Крепость", value: "20 мг/мл" },
    ],
  },
  {
    id: "fx-arqa-premium",
    name: "ARQA Premium",
    categoryId: "cat-disposables",
    sku: "ODN-021",
    price: 129000,
    stock: { "store-b1": 0, "store-b2": 0, "store-b3": 0 },
    images: [IMG.arqa],
    publishedAt: "2026-10-09T09:00:00Z",
    description: "Одноразовое устройство премиальной серии.",
    attributes: [{ code: "attr-taste", name: "Вкус", value: "Манго" }],
  },
  {
    id: "fx-liquid-classic",
    name: "Жидкость Bunker Classic, 30 мл",
    categoryId: "cat-liquids",
    sku: "LIQ-101",
    price: 89000,
    stock: { "store-b1": 8, "store-b2": 8, "store-b3": 8 },
    images: [IMG.liquid1],
    publishedAt: "2026-10-08T09:00:00Z",
    description: "Жидкость для заправки устройств, соотношение 50/50.",
    attributes: [
      { code: "attr-taste", name: "Вкус", value: "Классический табак" },
      { code: "attr-power", name: "Крепость", value: "3 мг/мл" },
    ],
  },
  {
    id: "fx-liquid-night",
    name: "Жидкость Night Shift, 30 мл",
    categoryId: "cat-liquids",
    sku: "LIQ-102",
    price: 99000,
    stock: { "store-b1": 4, "store-b2": 0, "store-b3": 3 },
    images: [IMG.liquid2],
    publishedAt: "2026-10-07T09:00:00Z",
    description: "Жидкость для заправки устройств, соотношение 70/30.",
    attributes: [
      { code: "attr-taste", name: "Вкус", value: "Лесные ягоды" },
      { code: "attr-power", name: "Крепость", value: "6 мг/мл" },
    ],
  },
  {
    id: "fx-liquid-mango",
    name: "Жидкость Mango Chill, 30 мл",
    categoryId: "cat-liquids",
    sku: "LIQ-103",
    price: 95000,
    stock: { "store-b1": 6, "store-b2": 2, "store-b3": 2 },
    images: [],
    publishedAt: "2026-10-06T09:00:00Z",
    description: "Жидкость для заправки устройств, вкус манго.",
    attributes: [
      { code: "attr-taste", name: "Вкус", value: "Манго" },
      { code: "attr-power", name: "Крепость", value: "3 мг/мл" },
    ],
  },
  {
    id: "fx-liquid-forest",
    name: "Жидкость Forest Mix, 30 мл",
    categoryId: "cat-liquids",
    sku: "LIQ-104",
    price: 105000,
    stock: { "store-b1": 3, "store-b2": 4, "store-b3": 0 },
    images: [],
    publishedAt: "2026-10-05T09:00:00Z",
    description: "Жидкость для заправки устройств, лесной микс.",
    attributes: [
      { code: "attr-taste", name: "Вкус", value: "Лесные ягоды" },
      { code: "attr-power", name: "Крепость", value: "6 мг/мл" },
    ],
  },
  {
    id: "fx-liquid-berry",
    name: "Жидкость Berry Blast, 30 мл",
    categoryId: "cat-liquids",
    sku: "LIQ-105",
    price: 115000,
    stock: { "store-b1": 2, "store-b2": 2, "store-b3": 2 },
    images: [],
    publishedAt: "2026-10-04T09:00:00Z",
    description: "Жидкость для заправки устройств, ягодный микс.",
    attributes: [
      { code: "attr-taste", name: "Вкус", value: "Ягодный микс" },
      { code: "attr-power", name: "Крепость", value: "6 мг/мл" },
    ],
  },
  {
    id: "fx-tea-oolong",
    name: "Китайский чай «Молочный улун», 50 г",
    categoryId: "cat-tea",
    sku: "TEA-001",
    price: 59000,
    stock: { "store-b1": 5, "store-b2": 5, "store-b3": 5 },
    images: [IMG.tea],
    publishedAt: "2026-10-14T09:00:00Z",
    description: "Классический молочный улун, фасовка 50 г.",
    attributes: [{ code: "attr-weight", name: "Фасовка", value: "50 г" }],
  },
  {
    id: "fx-tea-earl",
    name: "Чай «Эрл Грей», 50 г",
    categoryId: "cat-tea",
    sku: "TEA-002",
    price: 62000,
    stock: { "store-b1": 4, "store-b3": 2 },
    // Продаётся не во всех точках: в Северном оффера нет — проверка
    // серверного ответа «не представлен в выбранном магазине».
    skipOfferStores: ["store-b2"],
    images: [],
    publishedAt: "2026-10-13T09:00:00Z",
    description: "Чай Эрл Грей, фасовка 50 г.",
    attributes: [{ code: "attr-weight", name: "Фасовка", value: "50 г" }],
  },
  {
    id: "fx-lemonade",
    name: "Лимонад «Груша-мята», 0,5 л",
    categoryId: "cat-drinks",
    sku: "DRK-002",
    price: 18000,
    stock: { "store-b1": 12, "store-b2": 12, "store-b3": 6 },
    images: [],
    publishedAt: "2026-10-03T09:00:00Z",
    description: "Безалкогольный лимонад собственного ассортимента сети.",
    attributes: [{ code: "attr-volume", name: "Объём", value: "0,5 л" }],
  },
  {
    id: "fx-snack-nuts",
    name: "Снек «Орешки солёные», 40 г",
    categoryId: "cat-snacks",
    sku: "SNK-001",
    price: 12000,
    stock: { "store-b1": 20, "store-b2": 20, "store-b3": 20 },
    images: [],
    publishedAt: "2026-10-02T09:00:00Z",
    description: "Солёный арахис, фасовка 40 г.",
    attributes: [{ code: "attr-weight", name: "Фасовка", value: "40 г" }],
  },
  {
    id: "fx-snack-noodles",
    name: "Лапша быстрого приготовления «Стрим», 60 г",
    categoryId: "cat-snacks",
    sku: "SNK-002",
    price: 9000,
    stock: { "store-b1": 15, "store-b2": 0, "store-b3": 15 },
    images: [],
    publishedAt: "2026-10-01T09:00:00Z",
    description: "Лапша быстрого приготовления с вкусовыми добавками.",
    attributes: [{ code: "attr-taste", name: "Вкус", value: "Куриный" }],
  },
  {
    id: "aroma-01",
    name: "Ароматизатор «Ваниль», 10 мл",
    categoryId: "cat-flavors",
    sku: "ARO-001",
    price: 25000,
    stock: { "store-b1": 9, "store-b2": 9, "store-b3": 0 },
    images: [],
    publishedAt: "2026-10-15T09:00:00Z",
    description: "Пищевой ароматизатор для самозамеса, флакон 10 мл.",
    attributes: [{ code: "attr-volume", name: "Объём", value: "10 мл" }],
  },
  {
    id: "chew-01",
    name: "Паучи «Бункер Мята»",
    categoryId: "cat-pouches",
    sku: "CHEW-001",
    price: 210000,
    stock: { "store-b1": 3, "store-b2": 0, "store-b3": 4 },
    images: [],
    publishedAt: "2026-10-10T09:00:00Z",
    // Маркерный текст e2e-проверки публикации описаний регулируемых
    // классов (решение владельца 10.10.2026).
    description: "Не публикуется для регулируемого класса.",
    attributes: [
      { code: "attr-taste", name: "Вкус", value: "Мята" },
      { code: "attr-power", name: "Крепость", value: "6 мг/порция" },
    ],
  },
  {
    id: "nbc-01",
    name: "Неклассифицированная тестовая позиция",
    categoryId: "cat-nbs",
    sku: "NBC-001",
    price: 100000,
    stock: { "store-b1": 7, "store-b2": 0, "store-b3": 0 },
    images: [],
    publishedAt: "2026-10-01T09:00:00Z",
    description: "Позиция неклассифицированного корня — не публикуется.",
    attributes: [],
  },
];

function availability(amount) {
  if (amount <= 0) return "unavailable";
  if (amount <= 1) return "low";
  if (amount <= 3) return "available";
  return "plenty";
}

const stockDetail = {};
const snapshotProducts = products.map((product) => {
  stockDetail[product.id] = product.stock;
  return {
    id: product.id,
    slug: product.id,
    sku: product.sku,
    name: product.name,
    categoryId: product.categoryId,
    categoryName:
      categories.find((category) => category.id === product.categoryId)?.name ??
      "Каталог",
    images: product.images.map((src, index) => ({
      id: `${product.id}-${index}`,
      src,
      alt: `${product.name} — изображение ${index + 1}`,
    })),
    unit: "1 шт",
    description: product.description,
    attributes: product.attributes,
    offers: stores
      .filter((store) => !product.skipOfferStores?.includes(store.id))
      .map((store) => ({
        storeId: store.id,
        price: product.priceByStore?.[store.id] ?? product.price,
        currency: "RUB",
        availability: availability(product.stock[store.id] ?? 0),
      })),
    publishedAt: product.publishedAt,
  };
});

// Обложки категорий — первая фотография направления: живая выгрузка
// «МойСклад» делает то же в server/services/moysklad.ts.
for (const category of categories) {
  if (category.image) continue;
  const withPhoto = products.find(
    (item) => item.categoryId === category.id && item.images?.length,
  );
  if (withPhoto) category.image = withPhoto.images[0];
}

const snapshot = {
  updatedAt: Date.now(),
  stockUpdatedAt: Date.now(),
  meta: { cities, stores, categories, brands: [], materials: [] },
  products: snapshotProducts,
  stockDetail,
};

const target = path.join(root, "tests", "fixtures", "catalog.json");
await mkdir(path.dirname(target), { recursive: true });
await writeFile(target, JSON.stringify(snapshot, null, 2) + "\n");
console.log(`Fixture written: ${target} (${snapshotProducts.length} products)`);
