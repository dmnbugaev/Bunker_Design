<script setup lang="ts">
import { bunkerContacts } from "~~/shared/content/bunker";
import { storeSchemas } from "~~/shared/seo/schema";

const { data: meta, error, refresh } = await useCatalogMeta();
const { store, select, pickerOpen } = useStoreSelection();
// Описание SEO строится из фактических данных каталога, а не захардкоженных
// счётчиков — количество точек меняется с выгрузкой «МойСклад».
const seoDescription = computed(() => {
  const cities = meta.value?.cities ?? [];
  const stores = meta.value?.stores ?? [];
  const list = cities
    .map((city) => {
      const count = stores.filter((item) => item.cityId === city.id).length;
      return `${city.name} — ${count}`;
    })
    .join(", ");
  const total = stores.length;
  return `Адреса магазинов Бункер: ${total} ${total === 1 ? "точка" : "точек"} сети${list ? ` (${list})` : ""}. Режим работы и телефоны сети.`;
});
usePageSeo("Магазины", seoDescription, undefined, {
  index: true,
  breadcrumbs: [{ label: "Главная", to: "/" }, { label: "Магазины" }],
});
// Поиск по городу (Саратов, Энгельс, Москва) и конкретному адресу: пустой
// запрос показывает все точки сети по городам.
const search = ref("");
const searchWords = computed(() =>
  search.value
    .trim()
    .toLocaleLowerCase("ru")
    .replace(/ё/g, "е")
    .split(/\s+/)
    .filter(Boolean),
);
function storeMatches(
  item: { name: string; address?: string },
  cityName: string,
): boolean {
  if (!searchWords.value.length) return true;
  const haystack = `${cityName} ${item.name} ${item.address ?? ""}`
    .toLocaleLowerCase("ru")
    .replace(/ё/g, "е");
  return searchWords.value.every((word) => haystack.includes(word));
}
const citySections = computed(() =>
  (meta.value?.cities ?? [])
    .map((city) => ({
      city,
      stores: (meta.value?.stores ?? []).filter(
        (item) => item.cityId === city.id && storeMatches(item, city.name),
      ),
    }))
    .filter((section) => section.stores.length > 0),
);
const totalMatches = computed(() =>
  citySections.value.reduce((sum, section) => sum + section.stores.length, 0),
);
// Справочная разметка точек продаж: только проверяемые факты (адрес,
// телефон, часы работы, координаты), без Product/Offer. Источник — живые
// склады «МойСклад» из каталога (локальный справочник storeLocations —
// заглушка до данных владельца, см. docs/NEEDS-DATA.md).
const siteUrl = useRuntimeConfig().public.siteUrl || "https://bunker.example";
useHead({
  script: storeSchemas(
    (meta.value?.stores ?? []).map((store) => ({
      ...store,
      address: store.address ?? "",
    })),
    bunkerContacts,
    siteUrl,
  ).map((node) => ({
    type: "application/ld+json",
    innerHTML: JSON.stringify(node),
  })),
});
function chooseStore(id: string) {
  select(id);
  trackEvent("store_location_view", { storeId: id, source: "stores-page" });
}
onMounted(() => {
  // Основное содержимое страницы — адреса и режим работы точек сети.
  trackEvent("store_hours_view");
});
</script>
<template>
  <UiContainer class="page-shell"
    ><UiBreadcrumbs
      :items="[{ label: 'Главная', to: '/' }, { label: 'Магазины' }]"
    />
    <div class="page-heading">
      <p class="eyebrow">Бункер / Пространства</p>
      <h1>Ваш город.<br />Ваш магазин.</h1>
      <p>
        Выберите точку для просмотра цены и наличия. Список доступных магазинов
        обновляется из учётной системы.
      </p>
    </div>
    <div class="store-search">
      <UiField
        v-model="search"
        label="Поиск по городу или адресу"
        name="store-search"
        type="search"
        placeholder="Например: Энгельс или Мичурина"
        autocomplete="off"
      />
      <p v-if="searchWords.length" class="caption" role="status">
        Найдено точек: {{ totalMatches }}
      </p>
    </div>
    <UiButton variant="secondary" @click="pickerOpen = true"
      >Выбрать город и магазин</UiButton
    ><UiEmptyState v-if="error" title="Не удалось загрузить магазины"
      >Попробуйте ещё раз.<template #action
        ><UiButton @click="refresh()">Повторить</UiButton></template
      ></UiEmptyState
    >
    <template v-else-if="citySections.length">
      <section
        v-for="section in citySections"
        :key="section.city.id"
        class="store-city"
      >
        <h2>{{ section.city.name }}</h2>
        <div class="store-grid">
          <article
            v-for="item in section.stores"
            :key="item.id"
            class="store-card"
          >
            <UiBadge>Магазин</UiBadge>
            <h3>{{ item.name }}</h3>
            <p>{{ item.description }}</p>
            <p class="caption">
              <template v-if="item.address">{{ item.address }}<br /></template>
              {{ item.hours ?? `Общий режим сети: ${bunkerContacts.hours}` }}
              <template v-if="item.license"
                ><br />
                Лицензия № {{ item.license.number }} (до
                {{ item.license.validUntil }})</template
              >
            </p>
            <UiButton
              variant="secondary"
              :disabled="store?.id === item.id"
              @click="chooseStore(item.id)"
              >{{
                store?.id === item.id
                  ? "Выбран этот магазин"
                  : "Выбрать эту точку"
              }}</UiButton
            >
          </article>
        </div>
      </section>
    </template>
    <UiEmptyState v-else title="Ничего не найдено" aria-live="polite">
      Проверьте запрос: поиск работает по городу (Саратов, Энгельс, Москва),
      названию и адресу точки.
    </UiEmptyState></UiContainer
  >
</template>
