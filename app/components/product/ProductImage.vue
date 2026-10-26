<script setup lang="ts">
import type { ProductImage } from "~~/shared/types/product";
const props = defineProps<{
  image?: ProductImage;
  eager?: boolean;
  /** Сервер скрыл изображения: нет подтверждённого 18+. */
  restricted?: boolean;
  /** Название товара: без фото плашка получает монограмму-маркировку. */
  label?: string;
}>();
const failed = ref(false);
watch(
  () => [props.image?.src, props.restricted],
  () => {
    failed.value = false;
  },
);
const glyph = computed(() => {
  const first = props.label?.trim()?.[0];
  return first ? first.toUpperCase() : "↗";
});
</script>

<template>
  <div class="product-image">
    <div
      v-if="restricted"
      class="image-placeholder image-placeholder--restricted"
      role="img"
      aria-label="Изображение доступно только совершеннолетним пользователям"
    >
      <span aria-hidden="true">18+</span>
      <span>Изображение доступно<br />совершеннолетним</span>
    </div>
    <template v-else-if="image && !failed">
      <!-- Размытая копия фото заполняет окно: у любых соотношений сторон
           МойСклад плашка выглядит заполненной, а не с пустыми полями. -->
      <img
        class="product-image__backdrop"
        :src="image.src"
        alt=""
        aria-hidden="true"
        :loading="eager ? 'eager' : 'lazy'"
        decoding="async"
      />
      <img
        class="product-image__front"
        :src="image.src"
        :alt="image.alt"
        :loading="eager ? 'eager' : 'lazy'"
        decoding="async"
        @error="failed = true"
      />
    </template>
    <div
      v-else
      class="image-placeholder"
      role="img"
      aria-label="Изображение отсутствует"
    >
      <!-- Монограмма названия — «складская маркировка» вместо пустой
           заглушки: категории без фото в МойСклад остаются живыми. -->
      <span aria-hidden="true" class="image-placeholder__glyph">{{
        glyph
      }}</span>
      <span>Изображение появится позже</span>
    </div>
  </div>
</template>
