<script setup lang="ts">
import type { Store } from "~~/shared/types/store";
const { data: meta, error, refresh, status } = await useCatalogMeta();
const {
  store,
  pickerOpen,
  select,
  detect,
  detecting,
  detectError,
  dismissPicker,
} = useStoreSelection();
const cityId = ref("");
const cityById = computed(
  () => new Map((meta.value?.cities ?? []).map((city) => [city.id, city])),
);
// Без выбранного города показываем все точки сразу, сгруппированные по
// городам, — магазин можно выбрать в один клик, не открывая список.
const storeGroups = computed(() => {
  const all = meta.value?.stores ?? [];
  const grouped = (meta.value?.cities ?? [])
    .map((city) => ({
      city,
      stores: all.filter((item) => item.cityId === city.id),
    }))
    .filter((group) => group.stores.length > 0);
  return cityId.value
    ? grouped.filter((group) => group.city.id === cityId.value)
    : grouped;
});
// Сквозная нумерация точек по сети — та же нумерация, что на странице
// «Магазины»: пикер и страница читаются как одно оглавление.
const numberedGroups = computed(() => {
  let counter = 0;
  return storeGroups.value.map((group) => ({
    ...group,
    stores: group.stores.map((item) => ({ store: item, number: ++counter })),
  }));
});
const visibleCount = computed(() =>
  storeGroups.value.reduce((sum, group) => sum + group.stores.length, 0),
);
function pluralPoints(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "точка";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "точки";
  return "точек";
}
// Строка под названием — адрес, если он не повторяет короткое имя точки,
// и режим работы (app/utils/store-label.ts).
const optionLine = (item: Store) =>
  [storeAddressLine(item), item.hours].filter(Boolean).join(" · ");
function pickCity(id: string) {
  // Повторное нажатие снимает фильтр — снова видны все магазины сети.
  cityId.value = cityId.value === id ? "" : id;
}
watch(
  pickerOpen,
  (open) => {
    if (open) cityId.value = store.value?.cityId ?? "";
  },
  { immediate: true },
);
// Магазин применяется сразу при выборе — отдельная кнопка не нужна.
function choose(id: string) {
  select(id);
  trackEvent("store_location_view", { storeId: id, source: "picker" });
}
// Любое закрытие без выбора магазина запоминаем, чтобы автоподстановка не
// открывала окно заново на каждом маршруте до конца сессии.
watch(pickerOpen, (open, was) => {
  if (was && !open && !store.value) dismissPicker();
});
// Сообщение об ошибке показываем только после ручной попытки: автодетект при
// первом визите мог честно не получить разрешение — это не повод пугать.
const attempted = ref(false);
async function detectHere() {
  attempted.value = true;
  const id = await detect({ force: true });
  if (id) cityId.value = store.value?.cityId ?? cityId.value;
}
</script>
<template>
  <UiDialog
    v-model="pickerOpen"
    title="Ваш город и магазин"
    class="store-dialog"
  >
    <div class="store-picker">
      <UiEmptyState v-if="error" title="Не удалось загрузить магазины">
        Попробуйте ещё раз.<template #action
          ><UiButton :loading="status === 'pending'" @click="refresh()"
            >Повторить</UiButton
          ></template
        >
      </UiEmptyState>
      <template v-else>
        <!-- Геолокация — единственная кнопка-подсказка над списком:
             остальное (пояснения, ссылки) убрано, панель решает одну
             задачу — выбор точки в два клика. -->
        <UiButton
          variant="quiet"
          class="store-picker__detect"
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
          Определить по геолокации</UiButton
        >
        <p
          v-if="attempted && detectError"
          class="field__help"
          role="status"
          aria-live="polite"
        >
          {{ geoErrorTexts[detectError] }}
        </p>
        <!-- Города — чипы со срезом угла: один клик вместо раскрытия
             выпадающего списка, повторный клик снимает фильтр. -->
        <div
          v-if="cityById.size > 1"
          class="store-cities"
          role="group"
          aria-label="Город"
        >
          <button
            v-for="city in cityById.values()"
            :key="city.id"
            type="button"
            class="city-chip"
            :aria-pressed="cityId === city.id"
            @click="pickCity(city.id)"
          >
            {{ city.name }}
          </button>
        </div>
        <!-- Точки — ведомость на hairline-разделителях с фирменной
             меткой-параллелограммом: плотный список читается быстрее
             стены одинаковых карточек. -->
        <fieldset class="store-options">
          <legend class="visually-hidden">Магазин</legend>
          <div class="store-options__head">
            <span class="store-options__label">Магазин</span>
            <span class="store-options__count">
              {{ visibleCount }} {{ pluralPoints(visibleCount) }}
            </span>
          </div>
          <template v-for="group in numberedGroups" :key="group.city.id">
            <p v-if="!cityId && storeGroups.length > 1" class="store-city">
              {{ group.city.name }}
              <span class="store-city__count caption">
                {{ group.stores.length }}
                {{ pluralPoints(group.stores.length) }}
              </span>
            </p>
            <label
              v-for="row in group.stores"
              :key="row.store.id"
              class="store-option"
              :class="{ 'store-option--selected': store?.id === row.store.id }"
            >
              <input
                type="radio"
                name="store"
                :value="row.store.id"
                :checked="store?.id === row.store.id"
                @change="choose(row.store.id)"
              />
              <span class="store-option__number caption">{{
                String(row.number).padStart(2, "0")
              }}</span>
              <span class="store-option__body">
                <strong>{{ row.store.name }}</strong>
                <span v-if="optionLine(row.store)" class="store-option__line">
                  {{ optionLine(row.store) }}
                </span>
              </span>
              <span class="store-option__mark" aria-hidden="true"></span>
            </label>
          </template>
        </fieldset>
      </template>
    </div>
  </UiDialog>
</template>
