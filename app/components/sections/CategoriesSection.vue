<script setup lang="ts">
import type { Category } from "~~/shared/types/category";
defineProps<{ categories: Category[] }>();
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
          <ProductImage
            :image="
              category.image
                ? { id: category.id, src: category.image, alt: category.name }
                : undefined
            "
            :label="category.name"
          />
        </span>
        <span class="category-tile__name">{{ category.name }}</span>
      </NuxtLink>
    </nav>
  </UiContainer>
</template>
