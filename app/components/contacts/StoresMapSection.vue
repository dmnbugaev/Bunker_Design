<script setup lang="ts">
// Магазины сети всегда приходят из «МойСклад» (мета каталога): локальный
// справочник shared/content/stores.ts лишь обогащает их координатами и
// адресами на стороне репозитория.
const { data: meta } = await useCatalogMeta();
const storeCities = computed(() => meta.value?.cities ?? []);
const storeLocations = computed(() => meta.value?.stores ?? []);

const selectedId = ref<string | null>(null);

const storesByCity = (cityId: string) =>
  storeLocations.value.filter((store) => store.cityId === cityId);

const storeCountLabel = (count: number) => {
  const last = count % 10;
  const tens = count % 100;
  let word = "магазинов";
  if (last === 1 && tens !== 11) {
    word = "магазин";
  } else if (last >= 2 && last <= 4 && (tens < 12 || tens > 14)) {
    word = "магазина";
  }
  return `${count} ${word}`;
};

// Сквозная нумерация точек по городам меты — та же нумерация, что в пикере
// шапки и на странице «Магазины»: три оглавления сети читаются одинаково.
const numberedGroups = computed(() => {
  let counter = 0;
  return storeCities.value
    .map((city) => ({
      city,
      rows: storesByCity(city.id).map((store) => ({
        store,
        number: ++counter,
      })),
    }))
    .filter((group) => group.rows.length > 0);
});

const toggleSelection = (id: string) => {
  selectedId.value = selectedId.value === id ? null : id;
  if (selectedId.value)
    trackEvent("store_location_view", { storeId: id, source: "contacts-list" });
};

// Клик по маркеру всегда выбирает точку: повторный клик по пину
// не должен закрывать попап.
const selectFromMap = (id: string) => {
  selectedId.value = id;
  // Взаимодействие с картой магазинов: техническое событие аналитики
  // (без персональных данных, см. app/utils/analytics.ts).
  trackEvent("store_map_open", { storeId: id });
};
</script>

<template>
  <section class="stores-map-section" aria-labelledby="stores-map-heading">
    <div class="stores-map-intro">
      <h2 id="stores-map-heading">Наши магазины</h2>
      <p class="caption">Выберите ближайший магазин</p>
    </div>
    <div class="stores-map-layout">
      <div class="stores-map-frame">
        <StoreMapCanvas
          :stores="storeLocations"
          :cities="storeCities"
          :selected-id="selectedId"
          @select="selectFromMap"
        />
      </div>
      <!-- Ведомость точек на hairline-разделителях — тот же мотив, что в
           пикере шапки и на странице «Магазины»: номер, название, улица и
           фирменная метка-параллелограмм вместо стены одинаковых карточек. -->
      <aside class="stores-map-list" aria-label="Список магазинов сети">
        <section
          v-for="group in numberedGroups"
          :key="group.city.id"
          class="stores-map-city"
        >
          <h3>
            {{ group.city.name }}
            <span class="caption">{{
              storeCountLabel(group.rows.length)
            }}</span>
          </h3>
          <ul>
            <li v-for="row in group.rows" :key="row.store.id">
              <button
                type="button"
                class="store-map-option"
                :class="{
                  'store-map-option--selected': selectedId === row.store.id,
                }"
                :aria-pressed="selectedId === row.store.id"
                @click="toggleSelection(row.store.id)"
              >
                <span class="store-map-option__number caption">{{
                  String(row.number).padStart(2, "0")
                }}</span>
                <span class="store-map-option__body">
                  <strong>{{ row.store.name }}</strong>
                  <span v-if="row.store.address" class="caption">
                    {{ row.store.address }}
                  </span>
                </span>
                <span class="store-map-option__mark" aria-hidden="true"></span>
              </button>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  </section>
</template>
