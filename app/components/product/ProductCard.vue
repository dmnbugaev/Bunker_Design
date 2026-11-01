<script setup lang="ts">
import type { Product } from "~~/shared/types/product";
const props = defineProps<{ product: Product }>();
const { add, quantityOf } = useSelectionList();
const { store } = useStoreSelection();
const inList = computed(() => quantityOf(props.product.id) > 0);
const quantity = computed(() => quantityOf(props.product.id));
/**
 * Нулевой остаток в выбранном магазине (или во всей сети, пока магазин не
 * выбран): такие позиции остаются в каталоге с меткой «Скоро в наличии»,
 * когда фильтр наличия снят.
 */
const soldOut = computed(() => {
  const selected = store.value;
  const offers = selected
    ? props.product.offers.filter((offer) => offer.storeId === selected.id)
    : props.product.offers;
  return (
    offers.length > 0 &&
    !offers.some(
      (offer) =>
        offer.availability === "plenty" ||
        offer.availability === "available" ||
        offer.availability === "low",
    )
  );
});
/* Листание фото окна: несколько снимков — стрелки по hover/focus на
   десктопе, свайп на тач-экранах, позиция — точки на нижней кромке. */
const multiImage = computed(() => props.product.images.length > 1);
const selected = ref(0);
watch(
  () => props.product.id,
  () => {
    selected.value = 0;
  },
);
const step = (direction: 1 | -1) => {
  const count = props.product.images.length;
  if (count < 2) return;
  selected.value = (selected.value + direction + count) % count;
};
/* Свайп: горизонтальный жест листает фото и отменяет переход по
   ссылке-подложке; вертикальный жест и короткие касания не мешают
   навигации в карточку. */
let touchStart: { x: number; y: number } | null = null;
const onTouchStart = (event: TouchEvent) => {
  const touch = event.touches[0];
  touchStart =
    event.touches.length === 1 && touch
      ? { x: touch.clientX, y: touch.clientY }
      : null;
};
const onTouchEnd = (event: TouchEvent) => {
  const start = touchStart;
  touchStart = null;
  const touch = event.changedTouches[0];
  if (!start || event.changedTouches.length !== 1 || !touch) return;
  const dx = touch.clientX - start.x;
  const dy = touch.clientY - start.y;
  if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    event.preventDefault();
    step(dx < 0 ? 1 : -1);
  }
};
</script>
<template>
  <article class="product-card" :class="{ 'product-card--soon': soldOut }">
    <div
      class="product-card__visual"
      @touchstart.passive="onTouchStart"
      @touchend="onTouchEnd"
    >
      <ProductImage
        :image="product.images[selected]"
        :restricted="product.imagesRestricted"
        :label="product.name"
      />
      <span v-if="soldOut" class="badge product-card__soon">
        Скоро в наличии
      </span>
      <template v-if="multiImage">
        <button
          type="button"
          class="product-card__nav product-card__nav--prev"
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
          class="product-card__nav product-card__nav--next"
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
        <div class="product-card__dots" aria-hidden="true">
          <span
            v-for="(image, index) in product.images"
            :key="image.id"
            class="product-card__dot"
            :class="{ 'product-card__dot--active': index === selected }"
          ></span>
        </div>
      </template>
      <NuxtLink
        :to="`/product/${product.slug}`"
        class="product-card__link"
        tabindex="-1"
        aria-hidden="true"
      ></NuxtLink>
    </div>
    <div class="product-card__body">
      <p class="caption product-card__category">
        {{ product.categoryName ?? "Каталог" }}
      </p>
      <h3 class="product-card__name">
        <NuxtLink :to="`/product/${product.slug}`">{{ product.name }}</NuxtLink>
      </h3>
      <ProductAvailability :product="product" />
      <ProductPrice :product="product" />
      <NuxtLink
        v-if="inList"
        to="/reserve"
        class="product-card__select product-card__select--active"
      >
        В списке<template v-if="quantity > 1"> · {{ quantity }}</template>
      </NuxtLink>
      <button
        v-else
        type="button"
        class="product-card__select"
        @click="add(product.id)"
      >
        + В список
      </button>
    </div>
  </article>
</template>
