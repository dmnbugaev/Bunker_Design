import type { StoreOffer } from "../types/store";
import type { CatalogMeta } from "../types/catalog";
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
export function isUsedProduct(
  product: Pick<Product, "categoryId">,
  categories: CatalogMeta["categories"],
): boolean {
  const byId = new Map(categories.map((item) => [item.id, item]));
  let current = product.categoryId ? byId.get(product.categoryId) : undefined;
  const visited = new Set<string>();
  while (current) {
    if (!current.parentId)
      return USED_ROOT_NAMES.has(
        current.name.trim().toLocaleLowerCase("ru").replace(/\s+/g, " "),
      );
    if (visited.has(current.parentId)) return false;
    visited.add(current.id);
    current = byId.get(current.parentId);
  }
  return false;
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
