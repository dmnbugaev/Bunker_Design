<script setup lang="ts">
const props = defineProps<{
  total: number;
  sort: string;
  activeCount: number;
}>();
const emit = defineEmits<{ sort: [value: string]; filters: [] }>();
const options = [
  { value: "popular", label: "Популярные" },
  { value: "price-asc", label: "Сначала дешевле" },
  { value: "price-desc", label: "Сначала дороже" },
  { value: "newest", label: "Новинки" },
];
const goodsWord = computed(() => {
  const n = props.total;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "товар";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "товара";
  return "товаров";
});
</script>
<template>
  <div class="catalog-toolbar">
    <p class="catalog-toolbar__count" role="status">
      Найдено: <strong>{{ total.toLocaleString("ru-RU") }}</strong>
      {{ goodsWord }}
    </p>
    <div class="catalog-toolbar__controls">
      <UiButton
        class="mobile-filters-trigger"
        variant="secondary"
        @click="emit('filters')"
        >Фильтры{{ activeCount ? ` · ${activeCount}` : "" }}</UiButton
      >
      <UiSelect
        label="Сортировка"
        :model-value="sort"
        :options="options"
        @update:model-value="emit('sort', $event)"
      />
    </div>
  </div>
</template>
