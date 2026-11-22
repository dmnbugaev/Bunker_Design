import type { StoreOffer } from "../types/store";
import type { CatalogMeta } from "../types/catalog";
import type { Category } from "../types/category";
import type { Product } from "../types/product";
export const availabilityLabels = {
  plenty: "Много в наличии",
  available: "В наличии",
  low: "Мало в наличии",
  /** Нулевой остаток: ассортимент пополняется, поэтому оптимистичная метка. */
  unavailable: "Скоро в наличии",
  unknown: "Наличие уточняется",
} as const;
/** В оффере есть остаток: plenty/available/low, в отличие от «Скоро в наличии». */
export const isStockedOffer = (offer: Pick<StoreOffer, "availability">) =>
  offer.availability === "plenty" ||
  offer.availability === "available" ||
  offer.availability === "low";
const currencyFormat = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});
export const formatPrice = (minorUnits: number) =>
  currencyFormat.format(minorUnits / 100);
export const getOffer = (product: Product, storeId: string) =>
  product.offers.find((offer) => offer.storeId === storeId);

/**
 * Товар комиссионной ветки б/у устройств (корень «Vape Express», прежнее
 * имя — «Б/у устройства (VEX)»). Б/у позиции единичны: нулевой остаток
 * означает продажу, а не пополнение — optimistic-метка «Скоро в наличии»
 * к ним не применяется.
 */
const USED_ROOT_NAMES = new Set(["vape express", "б/у устройства (vex)"]);
const isUsedRootName = (name: string) =>
  USED_ROOT_NAMES.has(name.trim().toLocaleLowerCase("ru").replace(/\s+/g, " "));
export function isUsedProduct(
  product: Pick<Product, "categoryId">,
  categories: CatalogMeta["categories"],
): boolean {
  const byId = new Map(categories.map((item) => [item.id, item]));
  let current = product.categoryId ? byId.get(product.categoryId) : undefined;
  const visited = new Set<string>();
  while (current) {
    if (!current.parentId) return isUsedRootName(current.name);
    if (visited.has(current.parentId)) return false;
    visited.add(current.id);
    current = byId.get(current.parentId);
  }
  return false;
}
/**
 * Id категорий комиссионной ветки б/у (корни «Vape Express» / «Б/у
 * устройства (VEX)» вместе со всеми потомками): принадлежность категории
 * или товара к ветке проверяется за O(1) — на сервере сортировки и в
 * интерфейсе каталога, где ветка делится на «в выбранном магазине» и
 * «в других магазинах сети».
 */
export function usedCategoryIds(
  categories: CatalogMeta["categories"],
): Set<string> {
  const children = new Map<string, Category[]>();
  for (const item of categories)
    if (item.parentId)
      children.set(item.parentId, [
        ...(children.get(item.parentId) ?? []),
        item,
      ]);
  const ids = new Set<string>();
  const queue = categories
    .filter((item) => !item.parentId && isUsedRootName(item.name))
    .map((item) => item.id);
  while (queue.length) {
    const id = queue.pop()!;
    if (ids.has(id)) continue;
    ids.add(id);
    for (const child of children.get(id) ?? []) queue.push(child.id);
  }
  return ids;
}
/** Русская плюрализация: 1 позиция / 2 позиции / 5 позиций. */
export const pluralPosition = (count: number) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "позиция";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
    return "позиции";
  return "позиций";
};
// МойСклад прикладывает совместимость к описанию отдельным абзацем
// «Совместимость: …» (после пустой строки). Отделяем её, чтобы страница
// товара показывала совместимость отдельным блоком с новой строки.
const COMPATIBILITY_MARKER = /(?:^|\n)[ \t]*Совместимость[ \t]*:[ \t]*/;
export const splitProductDescription = (description: string) => {
  const match = description.match(COMPATIBILITY_MARKER);
  if (!match || match.index === undefined)
    return { main: description.trim(), compatibility: null };
  const compatibility = description.slice(match.index + match[0].length).trim();
  return {
    main: description.slice(0, match.index).trim(),
    compatibility: compatibility || null,
  };
};
