<script setup lang="ts">
import type { Category } from "~~/shared/types/category";

defineProps<{ categories: Category[] }>();

// Фолббек-арт направлений: брендовые снимки из design-kit для ветвей, в
// которых в МойСклад ещё нет ни одной фотографии товара. Живая обложка
// (фото товара ветви) всегда важнее арта; сопоставление — по
// нормализованному имени корня (порядок корней зависит от склада).
const FALLBACK_ART: Record<string, string> = {
  жидкости: "/images/fx-liquid-1.webp",
  устройства: "/images/fx-pod.webp",
  "одноразовые эс": "/images/fx-stels.webp",
  "табак для кальяна": "/images/fx-tea.webp",
  ароматизаторы: "/images/fx-liquid-2.webp",
  "vape express": "/images/storefront.webp",
};
function artFor(category: Category):
  | {
      id: string;
      src: string;
      alt: string;
    }
  | undefined {
  const key = category.name.trim().toLocaleLowerCase("ru").replace(/\s+/g, " ");
  const src = category.image ?? FALLBACK_ART[key];
  return src ? { id: category.id, src, alt: category.name } : undefined;
}
</script>
<template>
  <UiContainer as="section" class="section"
    ><div class="section-heading">
      <h2>Найдите своё.</h2>
      <p>Витрина по направлениям. Цены и наличие — по выбранной точке.</p>
    </div>
    <!-- Плитки-направления: то же двухслойное фото-окно, что у карточек
         каталога (ProductImage даёт blur-подложку и монограмму для
         категорий без снимка) — главная и каталог говорят одним языком. -->
    <nav class="category-board" aria-label="Направления каталога">
      <NuxtLink
        v-for="category in categories"
        :key="category.id"
        :to="`/catalog/${category.slug}`"
        class="category-tile"
      >
        <span class="category-tile__window">
          <ProductImage :image="artFor(category)" :label="category.name" />
        </span>
        <span class="category-tile__name">{{ category.name }}</span>
      </NuxtLink>
    </nav>
  </UiContainer>
</template>
