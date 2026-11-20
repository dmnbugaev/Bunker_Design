<script setup lang="ts">
import type { CatalogMeta } from "~~/shared/types/catalog";
import type { Product } from "~~/shared/types/product";
import {
  getOffer,
  availabilityLabels,
  isStockedOffer,
  isUsedProduct,
} from "~~/shared/utils/product";
const props = defineProps<{ product: Product }>();
const { store } = useStoreSelection();
const { data: meta } = useNuxtData<CatalogMeta>("catalog-meta");
/** Б/у позиции единичны: нулевой остаток — продажа, не пополнение. */
const used = computed(() =>
  isUsedProduct(props.product, meta.value?.categories ?? []),
);
const offer = computed(() =>
  store.value ? getOffer(props.product, store.value.id) : undefined,
);
/**
 * Точки сети, где товар в наличии, кроме выбранного магазина. Каталог
 * показывает ассортимент всей сети: устройство с нулевым остатком в выбранной
 * точке остаётся на витрине — метка называет магазины, где оно лежит
 * (жалоба владельца 19.11.2026: «не понятно, где оно»).
 */
const stockedElsewhere = computed(() =>
  props.product.offers.filter(
    (item) => item.storeId !== store.value?.id && isStockedOffer(item),
  ),
);
const storeName = (storeId: string) =>
  meta.value?.stores.find((item) => item.id === storeId)?.name ?? "";
/** «магазине» / «магазинах» — для хвоста «и ещё в N». */
const pluralStores = (count: number) =>
  count % 10 === 1 && count % 100 !== 11 ? "магазине" : "магазинах";
const elsewhereLabel = computed(() => {
  const names = stockedElsewhere.value
    .map((item) => storeName(item.storeId))
    .filter(Boolean);
  if (!names.length) return "";
  const head = names.slice(0, 2).join(" · ");
  const rest = names.length - 2;
  return rest > 0 ? `${head} и ещё в ${rest} ${pluralStores(rest)}` : head;
});
/** Статус для подсветки: зелёный — есть, янтарный — мало или в других
    магазинах, серый — нет товара или нет представительства в городе. */
const status = computed(() => {
  if (!store.value) return "any";
  if (offer.value && isStockedOffer(offer.value))
    return offer.value.availability === "low" ? "low" : "in";
  // Представлен, но с нулевым остатком: если в сети он лежит в других
  // точках — честнее назвать их, чем обещать «скоро».
  if (stockedElsewhere.value.length) return "elsewhere";
  return offer.value ? "out" : "none";
});
const label = computed(() => {
  if (!store.value) return "Выберите магазин";
  if (status.value === "elsewhere")
    return `Есть в ${
      stockedElsewhere.value.length === 1 ? "магазине" : "магазинах"
    }: ${elsewhereLabel.value}`;
  // Б/у позициям не обещают пополнение: нулевой остаток — «Нет в наличии».
  if (used.value && (status.value === "out" || status.value === "none"))
    return "Нет в наличии";
  if (offer.value) return availabilityLabels[offer.value.availability];
  return "Товар не представлен в этом городе";
});
</script>
<template>
  <p class="availability" :data-status="status">
    <span aria-hidden="true" />{{ label }}
  </p>
</template>
