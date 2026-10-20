import type { CatalogMeta } from "../../shared/types/catalog";
import type { Product } from "../../shared/types/product";
import type { Store } from "../../shared/types/store";
import {
  applyLegalPolicy,
  type PolicyCategory,
} from "../../shared/legal/catalog-policy";
import { storeAddresses } from "../data/store-addresses";
import { storeHours } from "../data/store-hours";
import { storeLicenses } from "../data/store-licenses";

const API = "https://api.moysklad.ru/api/remap/1.2/";
const PAGE_SIZE = 1000;

/**
 * Служебные склады, скрытые с сайта: имена из переменной окружения
 * MOYSKLAD_INTERNAL_STORES (через запятую) и префиксы из
 * MOYSKLAD_INTERNAL_STORE_PREFIXES (через запятую; например «РЦ», чтобы
 * скрывать распределительные центры с суффиксами). Идентификаторы аккаунта
 * ProHook не переносятся: состав скрытых складов задаётся под аккаунт
 * «Бункера» (см. docs/INTEGRATION.md).
 */
function internalStoreNames(): Set<string> {
  return new Set(
    (process.env.MOYSKLAD_INTERNAL_STORES ?? "")
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean),
  );
}
function internalStorePrefixes(): string[] {
  return (process.env.MOYSKLAD_INTERNAL_STORE_PREFIXES ?? "")
    .split(",")
    .map((prefix) => prefix.trim())
    .filter(Boolean);
}
function isInternalStore(name: string): boolean {
  return (
    internalStoreNames().has(name) ||
    internalStorePrefixes().some((prefix) => name.startsWith(prefix))
  );
}

/**
 * Типы цен «МойСклад» в порядке приоритета (MOYSKLAD_PRICE_TYPES, через
 * запятую; например «Цена продажи,Москва»). Для каждого магазина берётся
 * первый тип из списка, у которого у товара есть цена больше нуля. Без
 * переменной используется первый ненулевой тип цены самого товара — для
 * продающего сайта список рекомендуется задать явно.
 */
function priceTypeNames(): string[] {
  return (process.env.MOYSKLAD_PRICE_TYPES ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

/**
 * Имена дополнительных полей товара (MOYSKLAD_ATTR_PUBLISH,
 * MOYSKLAD_ATTR_SITE_NAME): необязательные текстовые/булевы поля, которые
 * может содержать аккаунт «Бункера». Отсутствующее поле не влияет на выгрузку.
 */
const ATTR_PUBLISH_NAME = (
  process.env.MOYSKLAD_ATTR_PUBLISH ?? "Показать на сайте"
).trim();
const ATTR_SITE_NAME_FIELD = (
  process.env.MOYSKLAD_ATTR_SITE_NAME ?? "Название для сайта"
).trim();

function normalizeAttributeName(name: string | undefined): string {
  return (name ?? "").trim().toLocaleLowerCase("ru").replace(/\s+/g, " ");
}

/** Имена дополнительных полей в нормализованном виде для сопоставления. */
function attrPublishKey(): string {
  return normalizeAttributeName(ATTR_PUBLISH_NAME);
}
function attrSiteNameKey(): string {
  return normalizeAttributeName(ATTR_SITE_NAME_FIELD);
}

/** Транслитерация кириллицы для стабильных id городов из имён групп складов. */
const TRANSLIT: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "c",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};
function slugifyCity(name: string): string {
  return (
    name
      .toLocaleLowerCase("ru")
      .split("")
      .map((char) => TRANSLIT[char] ?? char)
      .join("")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "stores"
  );
}

/**
 * Город магазина — по группе склада (pathName в «МойСклад»): имя группы
 * становится названием города, транслитерация — его стабильным id. Склад
 * без группы попадает в группу «Магазины». Состав городов определяется
 * структурой аккаунта «Бункера», а не кодом.
 */
interface StoreCity {
  id: string;
  name: string;
}
function cityFor(store: MsStore): StoreCity {
  const groupName = store.pathName?.trim();
  if (groupName) return { id: slugifyCity(groupName), name: groupName };
  return { id: "stores", name: "Магазины" };
}

interface MsMeta {
  href: string;
  size?: number;
}
interface MsCollection<T> {
  meta: MsMeta;
  rows: T[];
}
interface MsReference {
  meta?: MsMeta;
}
interface MsStore {
  id: string;
  name: string;
  archived?: boolean;
  pathName?: string;
  address?: string;
  description?: string;
}
interface MsFolder {
  id: string;
  name: string;
  archived?: boolean;
  productFolder?: MsReference;
}
interface MsPrice {
  value: number;
  priceType?: { name?: string };
}
interface MsProduct {
  id: string;
  name: string;
  archived?: boolean;
  article?: string;
  code?: string;
  description?: string;
  productFolder?: MsReference;
  salePrices?: MsPrice[];
  images?: { meta?: MsMeta };
  updated?: string;
  attributes?: Array<{
    id?: string;
    name?: string;
    meta?: MsMeta;
    value?: unknown;
  }>;
}
interface MsAttribute {
  id: string;
  name: string;
  type?: string;
}
interface MsStockStore {
  name?: string;
  stock?: number;
  reserve?: number;
  meta?: MsMeta;
}
interface MsStockRow {
  meta?: MsMeta;
  stockByStore?: MsStockStore[];
}

function token() {
  const value = process.env.NUXT_MOYSKLAD_TOKEN || process.env.MOYSKLAD_TOKEN;
  if (!value) throw new Error("MOYSKLAD_TOKEN is not configured");
  return value;
}

export async function moyskladFetch(
  path: string,
  timeout = 60000,
  binary = false,
): Promise<Response> {
  const url = new URL(path, API);
  if (
    url.origin !== new URL(API).origin ||
    !url.pathname.startsWith("/api/remap/1.2/")
  )
    throw new Error("Unexpected MoySklad URL");
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url, {
      headers: binary
        ? { Authorization: `Bearer ${token()}` }
        : {
            Authorization: `Bearer ${token()}`,
            Accept: "application/json;charset=utf-8",
            "Accept-Encoding": "gzip",
          },
      signal: AbortSignal.timeout(timeout),
    });
    if (response.ok) return response;
    if ((response.status === 429 || response.status >= 500) && attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 1500));
      continue;
    }
    throw new Error(`MoySklad request failed: HTTP ${response.status}`);
  }
  throw new Error("MoySklad request failed");
}

async function allRows<T>(path: string, timeout = 60000): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const url = new URL(path, API);
    url.searchParams.set("limit", String(PAGE_SIZE));
    url.searchParams.set("offset", String(offset));
    const response = await moyskladFetch(url.toString(), timeout);
    const page = (await response.json()) as MsCollection<T>;
    rows.push(...page.rows);
    if (
      page.rows.length < PAGE_SIZE ||
      rows.length >= (page.meta.size ?? Infinity)
    )
      break;
  }
  return rows;
}

function idOf(ref?: MsReference): string | undefined {
  return ref?.meta?.href?.split("?")[0]?.split("/").at(-1);
}

export interface CatalogSnapshot {
  updatedAt: number;
  stockUpdatedAt: number;
  meta: CatalogMeta;
  products: Product[];
  /**
   * Точные остатки штук для проверки запросов на резерв: productId →
   * storeId → доступно (stock − reserve). Только server-side: API каталога
   * отдаёт products/meta, это поле наружу не попадает.
   */
  stockDetail?: Record<string, Record<string, number>>;
}

export async function fetchCatalog(): Promise<CatalogSnapshot> {
  const [msStores, folders, msProducts, productAttributes] = await Promise.all([
    allRows<MsStore>("entity/store"),
    allRows<MsFolder>("entity/productfolder"),
    allRows<MsProduct>("entity/product?filter=archived=false"),
    allRows<MsAttribute>("entity/product/metadata/attributes"),
  ]);
  const publishKey = attrPublishKey();
  const publishField = productAttributes.find(
    (field) => normalizeAttributeName(field.name) === publishKey,
  );
  const siteNameKey = attrSiteNameKey();
  const siteNameField = productAttributes.find(
    (field) => normalizeAttributeName(field.name) === siteNameKey,
  );
  const cities = new Map<string, string>();
  const stores: Store[] = msStores
    .filter((item) => !item.archived && !isInternalStore(item.name.trim()))
    .map((item) => {
      const city = cityFor(item);
      cities.set(city.id, city.name);
      return {
        id: item.id,
        cityId: city.id,
        name: item.name,
        // Нейтральный фолбэк: адрес точки показывается отдельной строкой.
        description: item.description?.trim() || "Магазин сети Бункер",
        ...(storeAddresses[item.id] || item.address?.trim()
          ? { address: storeAddresses[item.id] || item.address!.trim() }
          : {}),
        ...(storeHours[item.id] ? { hours: storeHours[item.id] } : {}),
        ...(storeLicenses[item.id] ? { license: storeLicenses[item.id] } : {}),
      };
    })
    .sort(
      (a, b) =>
        a.cityId.localeCompare(b.cityId) || a.name.localeCompare(b.name, "ru"),
    );
  const allowedPriceTypes = priceTypeNames();
  const visible = msProducts.filter((item) => {
    const prices = item.salePrices ?? [];
    const published =
      !publishField ||
      Boolean(
        item.attributes?.some(
          (attribute) =>
            (attribute.id === publishField.id ||
              attribute.meta?.href?.endsWith(`/${publishField.id}`) ||
              normalizeAttributeName(attribute.name) === publishKey) &&
            (attribute.value === true ||
              (typeof attribute.value === "string" &&
                ["да", "true", "1"].includes(
                  attribute.value.toLocaleLowerCase("ru"),
                ))),
        ),
      );
    const hasPrice = allowedPriceTypes.length
      ? allowedPriceTypes.some((type) =>
          prices.some(
            (price) => price.priceType?.name === type && price.value > 0,
          ),
        )
      : prices.some((price) => price.value > 0);
    return !item.archived && published && hasPrice;
  });
  const folderMap = new Map(folders.map((item) => [item.id, item]));
  const usedFolders = new Set<string>();
  for (const item of visible) {
    let id = idOf(item.productFolder);
    while (id && !usedFolders.has(id)) {
      usedFolders.add(id);
      id = idOf(folderMap.get(id)?.productFolder);
    }
  }
  // legalClass и agePublic назначаются ниже централизованно
  // (applyLegalPolicy).
  const categories: PolicyCategory[] = folders
    .filter((folder) => usedFolders.has(folder.id) && !folder.archived)
    .map((folder) => ({
      id: folder.id,
      slug: folder.id,
      name: folder.name,
      description: `Товары категории «${folder.name}».`,
      parentId: idOf(folder.productFolder) ?? null,
    }));
  const categoryNames = new Map(categories.map((item) => [item.id, item.name]));
  const products = visible
    .map((item) => {
      const siteNameValue = item.attributes?.find(
        (attribute) =>
          siteNameField &&
          (attribute.id === siteNameField.id ||
            attribute.meta?.href
              ?.split("?")[0]
              ?.endsWith(`/${siteNameField.id}`) ||
            normalizeAttributeName(attribute.name) === siteNameKey),
      )?.value;
      const name =
        typeof siteNameValue === "string" && siteNameValue.trim()
          ? siteNameValue.trim()
          : item.name;
      const categoryId = idOf(item.productFolder) ?? "";
      const prices = new Map(
        (item.salePrices ?? []).map((price) => [
          price.priceType?.name,
          price.value,
        ]),
      );
      const imageCount = Math.min(5, item.images?.meta?.size ?? 0);
      const offers = stores.flatMap((store) => {
        const price = allowedPriceTypes.length
          ? (allowedPriceTypes.find((type) => (prices.get(type) ?? 0) > 0) ??
            "")
          : [...prices.entries()]
              .filter(([, value]) => value > 0)
              .map(([type]) => type)[0];
        const value = price ? (prices.get(price) ?? 0) : 0;
        return value > 0
          ? [
              {
                storeId: store.id,
                price: Math.round(value),
                currency: "RUB" as const,
                availability: "unknown" as const,
              },
            ]
          : [];
      });
      const attributes = (item.attributes ?? [])
        .filter(
          (attribute) =>
            typeof attribute.value === "string" &&
            attribute.value &&
            (!siteNameField ||
              (attribute.id !== siteNameField.id &&
                normalizeAttributeName(attribute.name) !== siteNameKey)),
        )
        .map((attribute) => ({
          code: attribute.id ?? attribute.name ?? "",
          name: attribute.name ?? "Характеристика",
          value: String(attribute.value),
        }));
      return {
        id: item.id,
        slug: item.id,
        sku: item.article || item.code || item.id,
        name,
        categoryId,
        categoryName: categoryNames.get(categoryId) ?? "Каталог",
        images: Array.from({ length: imageCount }, (_, index) => ({
          id: `${item.id}-${index}`,
          src: `/api/products/${item.id}/images/${index}`,
          alt: `${name} — изображение ${index + 1}`,
        })),
        unit: "1 шт" as const,
        // Описание берётся из МойСклад как есть; пустое не подменяется
        // заглушкой — карточка просто не показывает блок «О товаре».
        description: item.description?.trim() ?? "",
        attributes,
        offers,
        publishedAt: item.updated ? item.updated.replace(" ", "T") + "Z" : "",
      };
    })
    .filter((item) => item.offers.length > 0);
  // Юридическая политика применяется к снимку до подсчёта категорий:
  // запрещённые и неклассифицированные категории и товары не публикуются,
  // у регулируемых классов убираются свободные описания.
  const classified = applyLegalPolicy({
    updatedAt: Date.now(),
    stockUpdatedAt: 0,
    meta: {
      cities: [...cities.entries()].map(([id, name]) => ({ id, name })),
      stores,
      categories,
      brands: [],
      materials: [],
    },
    products,
  });
  const categoryById = new Map(
    classified.meta.categories.map((category) => [category.id, category]),
  );
  const rootCounts = new Map<string, number>();
  for (const product of classified.products) {
    let id: string | null = product.categoryId;
    const visited = new Set<string>();
    while (id && !visited.has(id)) {
      visited.add(id);
      const category = categoryById.get(id);
      if (!category) break;
      if (!category.image && product.images[0])
        category.image = product.images[0].src;
      if (!category.parentId) rootCounts.set(id, (rootCounts.get(id) ?? 0) + 1);
      id = category.parentId;
    }
  }
  classified.meta.categories.sort((a, b) =>
    !a.parentId && !b.parentId
      ? (rootCounts.get(b.id) ?? 0) - (rootCounts.get(a.id) ?? 0) ||
        a.name.localeCompare(b.name, "ru")
      : a.name.localeCompare(b.name, "ru"),
  );
  return classified;
}

export async function fetchStock(snapshot: CatalogSnapshot): Promise<{
  products: Product[];
  stockDetail: CatalogSnapshot["stockDetail"];
}> {
  const rows = await allRows<MsStockRow>(
    "report/stock/bystore?filter=stockMode=nonEmpty",
    120000,
  );
  const productStock = new Map<string, Map<string, number>>();
  const storeIds = new Set(snapshot.meta.stores.map((store) => store.id));
  // Older responses without metadata may be matched only by a unique name.
  const storesByName = new Map<string, string | undefined>();
  for (const store of snapshot.meta.stores) {
    storesByName.set(
      store.name,
      storesByName.has(store.name) ? undefined : store.id,
    );
  }
  for (const row of rows) {
    const id = row.meta?.href?.split("?")[0]?.split("/").at(-1);
    if (!id) continue;
    const byStore = new Map<string, number>();
    for (const entry of row.stockByStore ?? []) {
      const referenceId = idOf(entry);
      const storeId = referenceId
        ? storeIds.has(referenceId)
          ? referenceId
          : undefined
        : entry.name
          ? storesByName.get(entry.name)
          : undefined;
      if (storeId)
        byStore.set(storeId, (entry.stock ?? 0) - (entry.reserve ?? 0));
    }
    productStock.set(id, byStore);
  }
  const stockDetail: NonNullable<CatalogSnapshot["stockDetail"]> = {};
  const products = snapshot.products.map((product) => {
    const byStore = productStock.get(product.id);
    if (byStore && byStore.size > 0) {
      stockDetail[product.id] = Object.fromEntries(byStore);
    }
    return {
      ...product,
      offers: product.offers.map((offer) => {
        const amount = byStore?.get(offer.storeId) ?? 0;
        return {
          ...offer,
          availability:
            amount <= 0
              ? ("unavailable" as const)
              : amount <= 1
                ? ("low" as const)
                : amount <= 3
                  ? ("available" as const)
                  : ("plenty" as const),
        };
      }),
    };
  });
  return { products, stockDetail };
}

const imageLists = new Map<string, { expires: number; urls: string[] }>();

export async function fetchProductImage(
  productId: string,
  index: number,
): Promise<Response> {
  if (
    !/^[0-9a-f-]{36}$/.test(productId) ||
    !Number.isInteger(index) ||
    index < 0 ||
    index > 4
  )
    throw new Error("Invalid image request");
  let cached = imageLists.get(productId);
  if (!cached || cached.expires < Date.now()) {
    const response = await moyskladFetch(
      `entity/product/${productId}/images?limit=5`,
    );
    const collection = (await response.json()) as MsCollection<{
      meta: MsMeta & { downloadHref?: string };
    }>;
    cached = {
      expires: Date.now() + 5 * 60 * 1000,
      urls: collection.rows.map((image) => image.meta.downloadHref ?? ""),
    };
    imageLists.set(productId, cached);
  }
  const download = cached.urls[index];
  if (!download) throw new Error("Image not found");
  return moyskladFetch(download, 60000, true);
}
