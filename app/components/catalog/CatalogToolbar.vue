<script setup lang="ts">
defineProps<{ total: number; sort: string; activeCount: number }>();
const emit = defineEmits<{ sort: [value: string]; filters: [] }>();
const options = [
  { value: "popular", label: "Рекомендуем" },
  { value: "price-asc", label: "Сначала дешевле" },
  { value: "price-desc", label: "Сначала дороже" },
  { value: "newest", label: "Новинки" },
];
</script>
<template>
  <div class="catalog-toolbar">
    <p class="caption" role="status">
      Найдено товаров: <strong>{{ total }}</strong>
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
