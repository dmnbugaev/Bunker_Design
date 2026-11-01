<script setup lang="ts">
import type { Category } from "~~/shared/types/category";
const props = defineProps<{ categorySlug?: string; search?: boolean }>();
const route = useRoute();
const {
  data: meta,
  error: metaError,
  refresh: refreshMeta,
} = await useCatalogMeta();
const category = computed(() =>
  meta.value?.categories.find((item) => item.slug === props.categorySlug),
);
if (props.categorySlug && meta.value && !category.value)
  throw createError({
    statusCode: 404,
    statusMessage: "Not Found",
    message: "Категория не найдена",
  });
const { parsed, requestQuery, values, activeCount, apply, reset, sort } =
  useCatalogQuery(() => props.categorySlug ?? "");
const { data, error, status, refresh } = await useProducts(requestQuery);
const ageConfirmed = useAgeConfirmed();
// До подтверждения 18+ навигация показывает только общедоступные
// категории (сервер и выдачу ограничивает общедоступным ассортиментом).
const visibleCategories = (categories: Category[]) =>
  ageConfirmed.value ? categories : categories.filter((item) => item.agePublic);
const gatedCategory = computed(
  () =>
    !ageConfirmed.value &&
    Boolean(category.value) &&
    !category.value!.agePublic,
);
// Подтверждение по кнопке на странице: cookie пишет layout, здесь
// дозагружаем полный каталог без перезагрузки.
watch(ageConfirmed, (value) => {
  if (value) void refresh();
});
const filtersOpen = ref(false);
const { store, city, pickerOpen } = useStoreSelection();
const title = computed(() =>
  props.search
    ? parsed.value.q
      ? `Результаты для «${parsed.value.q}»`
      : "Поиск"
    : (category.value?.name ?? "Каталог"),
);
const description = computed(
  () =>
    category.value?.description ??
    "Товары Бункер: категории, цены и наличие по магазинам.",
);
usePageSeo(title, description);
const parents = computed(() =>
  visibleCategories(
    meta.value?.categories.filter((item) => !item.parentId) ?? [],
  ),
);
const children = computed(() =>
  visibleCategories(
    meta.value?.categories.filter(
      (item) => item.parentId === category.value?.id,
    ) ?? [],
  ),
);
// Дети активного корня для дерева в сайдбаре: внутри подкатегории
// показываем её соседей, а не внуков.
const activeRootId = computed(() =>
  category.value ? (category.value.parentId ?? category.value.id) : undefined,
);
const sidebarChildren = computed(() =>
  visibleCategories(
    meta.value?.categories.filter(
      (item) => item.parentId === activeRootId.value,
    ) ?? [],
  ),
);
// Чипы активных фильтров: только явно применённые пользователем —
// фильтр наличия, включённый по умолчанию, чипом не подсвечивается.
type ChipKey = "price" | "available";
const chips = computed<{ key: ChipKey; label: string }[]>(() => {
  const list: { key: ChipKey; label: string }[] = [];
  if (values.value.minPrice || values.value.maxPrice)
    list.push({
      key: "price",
      label: `Цена: ${values.value.minPrice || "0"}–${values.value.maxPrice || "∞"}`,
    });
  if (parsed.value.available)
    list.push({ key: "available", label: "В наличии" });
  return list;
});
function removeChip(key: ChipKey) {
  if (key === "price") return apply({ minPrice: "", maxPrice: "" });
  return apply({ [key]: false });
}
const applyFilters = apply;
const resetFilters = reset;
watch(
  () => route.fullPath,
  () => {
    if (import.meta.client) window.scrollTo({ top: 0, behavior: "instant" });
  },
);
// Технические ошибки загрузки каталога/поиска — событие аналитики без
// содержимого запроса (только scope и HTTP-статус).
watch(error, (value) => {
  if (!value) return;
  trackEvent(props.search ? "site_search_error" : "catalog_technical_error", {
    scope: "products",
    status: value.statusCode ?? 0,
  });
});
watch(metaError, (value) => {
  if (!value) return;
  trackEvent("catalog_technical_error", {
    scope: "meta",
    status: value.statusCode ?? 0,
  });
});
onMounted(() => {
  if (error.value)
    trackEvent(props.search ? "site_search_error" : "catalog_technical_error", {
      scope: "products",
      status: error.value.statusCode ?? 0,
    });
  if (metaError.value)
    trackEvent("catalog_technical_error", {
      scope: "meta",
      status: metaError.value.statusCode ?? 0,
    });
});
</script>
<template>
  <UiContainer class="page-shell">
    <div class="catalog-head">
      <div>
        <h1 class="catalog-title">{{ title }}</h1>
        <p class="catalog-description">{{ description }}</p>
      </div>
      <div class="catalog-store">
        <span class="catalog-store__icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 21s-6.5-5.5-6.5-10.5a6.5 6.5 0 1 1 13 0C18.5 15.5 12 21 12 21Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linejoin="round"
            />
            <circle cx="12" cy="10.5" r="2.25" fill="currentColor" />
          </svg>
        </span>
        <div class="catalog-store__info">
          <span class="catalog-store__label">{{
            store ? "Цены и наличие" : "Минимальная цена по городам"
          }}</span>
          <span class="catalog-store__value">{{
            store ? `${city?.name} · ${store.name}` : "по всем магазинам сети"
          }}</span>
        </div>
        <button
          type="button"
          class="button button--outline button--sm"
          @click="pickerOpen = true"
        >
          {{ store ? "Изменить" : "Выбрать магазин" }}
        </button>
      </div>
    </div>
    <!-- Регулируемая категория до подтверждения 18+: вместо выдачи — блок
         подтверждения (товары этой категории сервер не отдаёт). -->
    <AgeNotice
      v-if="gatedCategory"
      title="Категория для лиц 18+"
      text="Эта часть каталога доступна после подтверждения совершеннолетнего возраста."
    />
    <!-- Общедоступная часть каталога: подсказка, что выдача неполная. -->
    <AgeNotice v-else />
    <template v-if="!gatedCategory">
      <SearchForm
        class="catalog-search"
        :initial="parsed.q"
        :autofocus="search"
        prominent
      />
      <!-- Горизонтальная навигация по категориям: планшет и мобильный,
           на десктопе её заменяет дерево в сайдбаре. -->
      <div class="catalog-strips">
        <CatalogCategories :categories="parents" :selected="category?.slug" />
        <nav
          v-if="children.length"
          class="subcategory-links"
          aria-label="Подкатегории"
        >
          <NuxtLink
            v-for="child in children"
            :key="child.id"
            :to="`/catalog/${child.slug}`"
            >{{ child.name }}</NuxtLink
          >
        </nav>
      </div>
      <UiEmptyState v-if="metaError" title="Не удалось загрузить каталог"
        >Попробуйте обновить данные.<template #action
          ><UiButton @click="refreshMeta()">Повторить</UiButton></template
        ></UiEmptyState
      >
      <template v-else>
        <CatalogToolbar
          :total="data?.total ?? 0"
          :sort="parsed.sort"
          :active-count="activeCount"
          @sort="sort"
          @filters="filtersOpen = true"
        />
        <div class="catalog-layout">
          <aside class="catalog-sidebar" aria-label="Фильтры каталога">
            <div>
              <p class="catalog-sidebar__title">Категории</p>
              <nav class="catalog-nav" aria-label="Категории каталога">
                <NuxtLink
                  to="/catalog"
                  :aria-current="!category ? 'page' : undefined"
                  >Все товары</NuxtLink
                >
                <template v-for="root in parents" :key="root.id">
                  <NuxtLink
                    :to="`/catalog/${root.slug}`"
                    :aria-current="
                      category &&
                      [category.id, category.parentId].includes(root.id)
                        ? 'page'
                        : undefined
                    "
                    >{{ root.name }}</NuxtLink
                  >
                  <div
                    v-if="root.id === activeRootId && sidebarChildren.length"
                    class="catalog-nav__children"
                  >
                    <NuxtLink
                      v-for="child in sidebarChildren"
                      :key="child.id"
                      :to="`/catalog/${child.slug}`"
                      :aria-current="
                        category?.id === child.id ? 'page' : undefined
                      "
                      >{{ child.name }}</NuxtLink
                    >
                  </div>
                </template>
              </nav>
            </div>
            <div>
              <p class="catalog-sidebar__title">Фильтры</p>
              <CatalogFilters
                :values="values"
                @apply="applyFilters"
                @reset="resetFilters"
              />
            </div>
          </aside>
          <div class="catalog-results" :aria-busy="status === 'pending'">
            <ul
              v-if="chips.length"
              class="filter-chips"
              aria-label="Активные фильтры"
            >
              <li v-for="chip in chips" :key="chip.key">
                <button type="button" @click="removeChip(chip.key)">
                  {{ chip.label }} <span aria-hidden="true">×</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  class="filter-chips__reset"
                  @click="resetFilters"
                >
                  Сбросить всё
                </button>
              </li>
            </ul>
            <div v-if="status === 'pending'" class="catalog-loading">
              <UiSkeleton v-for="n in 8" :key="n" />
            </div>
            <UiEmptyState v-else-if="error" title="Не удалось загрузить товары"
              >Проверьте соединение и повторите попытку.<template #action
                ><UiButton @click="refresh()">Повторить</UiButton></template
              ></UiEmptyState
            >
            <template v-else-if="data?.items.length"
              ><ProductGrid :products="data.items" /><CatalogPagination
                :page="data.page"
                :page-count="data.pageCount"
            /></template>
            <UiEmptyState v-else title="Ничего не найдено"
              >Попробуйте изменить запрос или снять часть фильтров.<template
                #action
                ><UiButton
                  v-if="activeCount"
                  variant="secondary"
                  @click="resetFilters"
                  >Сбросить фильтры</UiButton
                ><NuxtLink v-else to="/catalog" class="button button--secondary"
                  >Весь каталог</NuxtLink
                ></template
              ></UiEmptyState
            >
          </div>
        </div>
      </template>
      <UiDialog v-model="filtersOpen" title="Фильтры" drawer
        ><CatalogFilters
          v-if="meta && filtersOpen"
          :values="values"
          @apply="applyFilters"
          @reset="resetFilters"
      /></UiDialog>
    </template>
  </UiContainer>
</template>
