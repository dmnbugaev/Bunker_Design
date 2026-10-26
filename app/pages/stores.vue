<script setup lang="ts">
import { bunkerContacts } from "~~/shared/content/bunker";
import type { Store } from "~~/shared/types/store";
import { storeSchemas } from "~~/shared/seo/schema";

const { data: meta, error, refresh } = await useCatalogMeta();
const { store, select, detect, detecting, detectError } = useStoreSelection();
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
// Поиск по городу (Саратов, Энгельс) и конкретному адресу: пустой запрос
// показывает все точки сети по городам.
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
// Секции городов со сквозной нумерацией точек — как оглавление сети.
const citySections = computed(() => {
  let counter = 0;
  return (meta.value?.cities ?? [])
    .map((city) => ({
      city,
      rows: (meta.value?.stores ?? [])
        .filter(
          (item) => item.cityId === city.id && storeMatches(item, city.name),
        )
        .map((item) => ({ store: item, number: ++counter })),
    }))
    .filter((section) => section.rows.length > 0);
});
const totalMatches = computed(() =>
  citySections.value.reduce((sum, section) => sum + section.rows.length, 0),
);
const allStores = computed(() => meta.value?.stores ?? []);
function pluralPoints(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "точка";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "точки";
  return "точек";
}
const introLead = computed(() => {
  const parts = (meta.value?.cities ?? [])
    .map((city) => {
      const count = allStores.value.filter(
        (item) => item.cityId === city.id,
      ).length;
      return `${city.name} — ${count}`;
    })
    .join(", ");
  const total = allStores.value.length;
  return `${total} ${pluralPoints(total)} сети${parts ? `: ${parts}` : ""}. Выберите удобную — каталог покажет цены и наличие по ней.`;
});
// Режим точки: индивидуальный из выгрузки или общий режим сети.
function storeHours(item: { hours?: string }): string {
  return item.hours ?? bunkerContacts.hours;
}
// Строка фактов о точке: полный адрес и режим. Лицензии каждой точки
// публикуются целиком на /information — в ведомости они повторялись
// 21 раз и утяжеляли список.
function storeLine(item: Store): string {
  return [item.address, storeHours(item)].filter(Boolean).join(" · ");
}
// Справочная разметка точек продаж: только проверяемые факты (адрес,
// телефон, часы работы, координаты), без Product/Offer. Источник — живые
// склады «МойСклад» из каталога; точки без склада (например «Чапаева, 45»
// в Энгельсе) публикуются справочно (server/data/extra-stores.ts).
const siteUrl = useRuntimeConfig().public.siteUrl || "https://bunker.example";
useHead({
  script: storeSchemas(
    allStores.value.map((item) => ({
      ...item,
      address: item.address ?? "",
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
// Геолокация на странице: подставляет ближайшую точку и подсвечивает её
// строку. Сообщение об ошибке — только после ручной попытки.
const geoAttempted = ref(false);
async function detectHere() {
  geoAttempted.value = true;
  await detect({ force: true });
}
onMounted(() => {
  // Основное содержимое страницы — адреса и режим работы точек сети.
  trackEvent("store_hours_view");
});
</script>
<template>
  <UiContainer class="page-shell stores-page">
    <div class="page-heading">
      <h1>Магазины.</h1>
      <p>{{ introLead }}</p>
    </div>
    <div class="stores-toolbar">
      <UiField
        v-model="search"
        label="Поиск по городу или адресу"
        name="store-search"
        type="search"
        placeholder="Например: Энгельс или Рахова"
        autocomplete="off"
      />
      <div class="stores-toolbar__side">
        <UiButton
          variant="quiet"
          class="stores-toolbar__geo"
          :loading="detecting"
          @click="detectHere"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 21s-6.5-5.5-6.5-10.5a6.5 6.5 0 1 1 13 0C18.5 15.5 12 21 12 21Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linejoin="round"
            />
            <circle cx="12" cy="10.5" r="2.25" fill="currentColor" />
          </svg>
          Рядом со мной</UiButton
        >
        <p
          v-if="geoAttempted && detectError"
          class="field__help"
          role="status"
          aria-live="polite"
        >
          {{ geoErrorTexts[detectError] }}
        </p>
        <p v-else-if="searchWords.length" class="caption" role="status">
          Найдено точек: {{ totalMatches }}
        </p>
      </div>
    </div>
    <UiEmptyState v-if="error" title="Не удалось загрузить магазины"
      >Попробуйте ещё раз.<template #action
        ><UiButton @click="refresh()">Повторить</UiButton></template
      ></UiEmptyState
    >
    <template v-else-if="citySections.length">
      <section
        v-for="section in citySections"
        :key="section.city.id"
        class="stores-city"
        :aria-label="section.city.name"
      >
        <div class="stores-city__head">
          <h2>{{ section.city.name }}</h2>
          <span class="caption stores-city__count">
            {{ section.rows.length }} {{ pluralPoints(section.rows.length) }}
          </span>
        </div>
        <!-- Ведомость точек: строка целиком кликабельна (скрытое радио),
             справа — фирменная метка-параллелограмм, как в пикере шапки.
             На широких экранах — две колонки, чтобы 15 саратовских адресов
             не вытягивались в бесконечный столбец. -->
        <ol class="stores-ledger">
          <li
            v-for="row in section.rows"
            :key="row.store.id"
            class="store-row"
            :class="{ 'store-row--selected': store?.id === row.store.id }"
          >
            <label>
              <input
                type="radio"
                name="stores-page-store"
                :value="row.store.id"
                :checked="store?.id === row.store.id"
                @change="chooseStore(row.store.id)"
              />
              <span class="store-row__number caption">{{
                String(row.number).padStart(2, "0")
              }}</span>
              <span class="store-row__body">
                <strong>{{ row.store.name }}</strong>
                <span class="store-row__line caption">
                  {{ storeLine(row.store) }}
                </span>
              </span>
              <span class="store-row__mark" aria-hidden="true"></span>
            </label>
          </li>
        </ol>
      </section>
    </template>
    <UiEmptyState v-else title="Ничего не найдено" aria-live="polite">
      Проверьте запрос: поиск работает по городу (Саратов, Энгельс), названию и
      адресу точки.
    </UiEmptyState></UiContainer
  >
</template>
