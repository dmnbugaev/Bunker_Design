<script setup lang="ts">
import type { CatalogMeta } from "~~/shared/types/catalog";
import type { Product } from "~~/shared/types/product";
import { isStockedOffer, isUsedProduct } from "~~/shared/utils/product";
const props = defineProps<{ product: Product }>();
const { add, quantityOf } = useSelectionList();
// Список выбранных — часть сценария резерва: анонимам кнопка не
// показывается (модерация рекламных карточек, 19.11.2026).
const { loggedIn } = useSessionUser();
const { data: meta } = useNuxtData<CatalogMeta>("catalog-meta");
const inList = computed(() => quantityOf(props.product.id) > 0);
const quantity = computed(() => quantityOf(props.product.id));
/**
 * «Скоро в наличии» — позиция с нулевым остатком во всей сети: каталог
 * показывает ассортимент всех магазинов, поэтому товар, лежащий в другой
 * точке, бейджа не получает — метка наличия называет магазины, где он есть.
 * У б/у позиций нулевой остаток — продажа (каждое устройство единично),
 * поэтому метка «Нет в наличии», а не обещание пополнения.
 */
const soldOut = computed(
  () =>
    props.product.offers.length > 0 &&
    !props.product.offers.some((offer) => isStockedOffer(offer)),
);
const soldOutLabel = computed(() =>
  isUsedProduct(props.product, meta.value?.categories ?? [])
    ? "Нет в наличии"
    : "Скоро в наличии",
);
/* Листание фото окна: несколько снимков — стрелки по hover/focus на
   десктопе, свайп на тач-экранах, позиция — точки на нижней кромке.
   Логика общая с галереей страницы товара (usePhotoFlip). */
const { selected, multiImage, step, onTouchStart, onTouchEnd } = usePhotoFlip(
  () => props.product.images,
);
watch(
  () => props.product.id,
  () => {
    selected.value = 0;
  },
);
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
        {{ soldOutLabel }}
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
        v-if="loggedIn && inList"
        to="/reserve"
        class="product-card__select product-card__select--active"
      >
        В списке<template v-if="quantity > 1"> · {{ quantity }}</template>
      </NuxtLink>
      <button
        v-else-if="loggedIn"
        type="button"
        class="product-card__select"
        @click="add(product.id)"
      >
        + В список
      </button>
    </div>
  </article>
</template>
