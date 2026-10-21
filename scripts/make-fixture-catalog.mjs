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

// Демо-точки фикстуры: реальные адреса сети предоставит владелец
// (docs/NEEDS-DATA.md); с живым аккаунтом каталог магазинов приходит из
// «МойСклад» (entity/store).
const stores = [
  {
    id: "store-b1",
    cityId: "saratov",
    name: "Центральный",
    description: "Демо-точка фикстуры",
    address: "ул. Примерная, 1",
    hours: "Ежедневно, 10:00–22:00",
    coordinates: [46.0326, 51.5336],
  },
  {
    id: "store-b2",
    cityId: "saratov",
    name: "Северный",
    description: "Демо-точка фикстуры",
    address: "пр. Примерный, 10",
    hours: "Ежедневно, 10:00–22:00",
    coordinates: [46.0059, 51.5905],
  },
  {
    id: "store-b3",
    cityId: "engels",
    name: "Энгельс",
    description: "Демо-точка фикстуры",
    address: "ул. Тельмана, 29",
    hours: "Ежедневно, 10:00–21:00",
    coordinates: [46.125, 51.478],
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
 * «МойСклад»; publishedAt задаёт порядок сортировки «Новинки» и секции
 * «Недавно обновлено» на главной.
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
