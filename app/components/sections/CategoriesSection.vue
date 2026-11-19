<script setup lang="ts">
import type { Category } from "~~/shared/types/category";

defineProps<{ categories: Category[] }>();

// Обложка направления — только живое фото товара ветви (category.image,
// ставится первым фото товара в снимке). Раньше для ветвей без фото
// подставлялись брендовые арты из design-kit — рекламные посты сети
// (fx-tea у табака, fx-stels у одноразок) — заказчик принял их за
// «подгрузившиеся картинки постов» и просил убрать (19.11.2026):
// без фото плитка остаётся честной монограммой ProductImage.
function artFor(category: Category):
  | {
      id: string;
      src: string;
      alt: string;
    }
  | undefined {
  const src = category.image;
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
