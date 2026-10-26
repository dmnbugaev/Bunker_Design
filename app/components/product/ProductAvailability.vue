<script setup lang="ts">
import type { Product } from "~~/shared/types/product";
import { getOffer, availabilityLabels } from "~~/shared/utils/product";
const props = defineProps<{ product: Product }>();
const { store } = useStoreSelection();
const offer = computed(() =>
  store.value ? getOffer(props.product, store.value.id) : undefined,
);
/** Статус для подсветки: зелёный — есть, янтарный — мало, серый — нет. */
const status = computed(() =>
  offer.value
    ? offer.value.availability === "plenty" ||
      offer.value.availability === "available"
      ? "in"
      : offer.value.availability === "low"
        ? "low"
        : "out"
    : store.value
      ? "none"
      : "any",
);
</script>
<template>
  <p class="availability" :data-status="status">
    <span aria-hidden="true" />{{
      store
        ? offer
          ? availabilityLabels[offer.availability]
          : "Товар не представлен в этом городе"
        : "Выберите магазин"
    }}
  </p>
</template>
