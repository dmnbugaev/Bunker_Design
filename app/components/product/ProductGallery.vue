<script setup lang="ts">
import type { ProductImage } from "~~/shared/types/product";
const props = defineProps<{
  images: ProductImage[];
  /** Сервер скрыл изображения: нет подтверждённого 18+. */
  restricted?: boolean;
  /** Название товара для монограммы, когда фото нет. */
  label?: string;
}>();
/* Листание главного окна: несколько снимков — стрелки по hover/focus
   (десктоп) и свайп (тач); позицию показывают миниатюры снизу.
   Логика общая с карточкой каталога (usePhotoFlip). */
const { selected, multiImage, step, onTouchStart, onTouchEnd } = usePhotoFlip(
  () => props.images,
);
watch(
  () => [props.images, props.restricted],
  () => {
    selected.value = 0;
  },
);
</script>

<template>
  <div class="product-gallery">
    <div
      class="product-gallery__window"
      @touchstart.passive="onTouchStart"
      @touchend="onTouchEnd"
    >
      <ProductImage
        :image="images[selected]"
        eager
        :restricted="restricted"
        :label="label"
      />
      <template v-if="multiImage">
        <button
          type="button"
          class="product-gallery__nav product-gallery__nav--prev"
          aria-label="Предыдущее фото товара"
          @click="step(-1)"
        >
          <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
            <path
              d="M7.5 2 3.5 6l4 4"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          class="product-gallery__nav product-gallery__nav--next"
          aria-label="Следующее фото товара"
          @click="step(1)"
        >
          <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
            <path
              d="M4.5 2l4 4-4 4"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </template>
    </div>
    <div
      v-if="images.length > 1"
      class="gallery-thumbnails"
      aria-label="Изображения товара"
    >
      <button
        v-for="(image, index) in images"
        :key="image.id"
        type="button"
        :aria-pressed="selected === index"
        :aria-label="`Показать изображение ${index + 1}`"
        @click="selected = index"
      >
        <ProductImage :image="image" />
      </button>
    </div>
    <p v-if="restricted" class="caption">
      Изображения товаров доступны только совершеннолетним пользователям.
    </p>
  </div>
</template>
