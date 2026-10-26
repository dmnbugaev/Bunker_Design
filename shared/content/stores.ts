import type { City, StoreLocation } from "~~/shared/types/store";
import storeCoordinatesJson from "./store-coordinates.json";

/**
 * Публичный список физических точек сети «Бункер».
 *
 * Основной источник магазинов для сайта — склады аккаунта «МойСклад»
 * Бункера (server/services/moysklad.ts); этот справочник согласован с ним
 * по id складов и адресам (server/data/store-addresses.ts, инвариант
 * tests/stores-data.test.mjs) и обогащает выгрузку координатами для карты
 * и геолокации. Адреса предоставлены владелицей 24.10.2026; склады
 * «Орджоникидзе», «Славянская пл.» и «Шевченко» в списке владелицы
 * отсутствуют — скрыты с сайта и здесь не заведены (docs/NEEDS-DATA.md).
 * Точка «Чапаева, 45» (Энгельс) без склада в аккаунте публикуется
 * справочно — её запись дублирует server/data/extra-stores.ts.
 *
 * Координаты лежат в store-coordinates.json: их заполняет и обновляет
 * `npm run stores:geocode` (только российские сервисы: Яндекс и 2ГИС,
 * по ключу из env) либо вносят вручную с публичной Яндекс.Карты. Точка
 * без записи в sidecar остаётся в списке, но без маркера на карте.
 */

interface StoreGeoEntry {
  /** [долгота, широта] — тот же порядок, что у API 2ГИС и Геокодера Яндекса. */
  coordinates: [number, number];
  /** "yandex" | "2gis" | "manual" | "nominatim" (последний — исторические). */
  source: string;
  /** Полный адрес, который вернул геокодер (для сверки). */
  resolved?: string;
  /** Дата геокодировки (ISO). */
  geocodedAt?: string;
  /** Ссылка на карточку в 2ГИС — появляется после геокодировки через 2ГИС. */
  mapsUrl?: string;
}

// Sidecar генерируется npm run stores:geocode; JSON-импорт даёт number[],
// поэтому приводим через unknown к кортежу [долгота, широта].
const geoById = storeCoordinatesJson as unknown as Record<
  string,
  StoreGeoEntry
>;

/** Города сети: id совпадают с транслитерацией групп «МойСклад». */
export const storeCities: readonly City[] = [
  { id: "saratov", name: "Саратов" },
  { id: "engels", name: "Энгельс" },
];

type StoreLocationDraft = Omit<StoreLocation, "coordinates" | "geoSource">;

/** id — стабильные id складов «МойСклад» (см. server/data/store-addresses.ts). */
const storeDrafts: readonly StoreLocationDraft[] = [
  // Саратов
  {
    id: "d1cbbf67-353f-11f0-0a80-03f60003d8ef",
    cityId: "saratov",
    name: "Рахова",
    address: "ул. Рахова, 64/70а",
  }, // СКЛАД РАХОВА
  {
    id: "067007d0-5281-11f0-0a80-01b70022a45b",
    cityId: "saratov",
    name: "Танкистов",
    address: "ул. Танкистов, 64",
  }, // СКЛАД ТАНКИСТОВ
  {
    id: "0797590a-388c-11f0-0a80-0d5d0018d909",
    cityId: "saratov",
    name: "2-я Садовая",
    address: "2-я Садовая ул., 4",
  }, // СКЛАД САДОВАЯ
  {
    id: "ef183d21-388b-11f0-0a80-159b0019c3cd",
    cityId: "saratov",
    name: "Вавилова",
    address: "ул. имени Н.И. Вавилова, 9",
  }, // СКЛАД ВАВИЛОВА
  {
    id: "d1232641-5280-11f0-0a80-18e60021aa11",
    cityId: "saratov",
    name: "Чапаева",
    address: "ул. имени В.И. Чапаева, 60/64",
  }, // СКЛАД ЧАПАЕВА
  {
    id: "4ed9aeea-5280-11f0-0a80-01b70022795f",
    cityId: "saratov",
    name: "Огородная",
    address: "ул. Огородная, 149",
  }, // СКЛАД ОГОРОДНАЯ
  {
    id: "e755a126-388b-11f0-0a80-0f2800195508",
    cityId: "saratov",
    name: "Техническая",
    address: "ул. Техническая, 5",
  }, // СКЛАД ТЕХНИЧЕСКАЯ
  {
    id: "01861b7c-388c-11f0-0a80-030800195577",
    cityId: "saratov",
    name: "Тархова",
    address: "ул. имени С.Ф. Тархова, 27",
  }, // СКЛАД ТАРХОВА
  {
    id: "fcb0f5fd-388b-11f0-0a80-11f80019242b",
    cityId: "saratov",
    name: "Колхозная площадь",
    address: "Колхозная площадь, 1А",
  }, // СКЛАД СЕННОЙ
  {
    id: "f72762b9-388b-11f0-0a80-0cb30018da5f",
    cityId: "saratov",
    name: "Сити Молл",
    address: "Ново-Астраханское шоссе, 107Гс1",
  }, // СКЛАД СИТИ МОЛЛ
  {
    id: "18c8a0df-5281-11f0-0a80-01b70022a80b",
    cityId: "saratov",
    name: "Горького",
    address: "ул. имени А.М. Горького, 30",
  }, // СКЛАД ПРОСПЕКТ-ГОРЬКОГО
  {
    id: "4987336f-7c08-11f0-0a80-05d4003c2670",
    cityId: "saratov",
    name: "Вольская",
    address: "ул. Вольская, 21/27",
  }, // СКЛАД ВОЛЬСКАЯ
  {
    id: "3175d078-3889-11f0-0a80-196100192a69",
    cityId: "saratov",
    name: "Ипподромная",
    address: "ул. Ипподромная, 9",
  }, // СКЛАД ИППОДРОМНАЯ
  {
    id: "5b53ae29-b94b-11f0-0a80-0d50002869c7",
    cityId: "saratov",
    name: "Вольская, 44",
    address: "ул. Вольская, 44",
  }, // СКЛАД ПРОСПЕКТ ВОЛЬСКАЯ (точка на проспекте)
  {
    id: "4edb6a87-bc61-11f0-0a80-0bb50015a597",
    cityId: "saratov",
    name: "Семёнова",
    address: "ул. имени Академика Н.Н. Семёнова, 9",
  }, // СКЛАД СЕМЁНОВА
  // Энгельс
  {
    id: "5062cdeb-46dc-11f0-0a80-19060010fe71",
    cityId: "engels",
    name: "Фридриха Энгельса",
    address: "проспект Фридриха Энгельса, 4",
  }, // СКЛАД ФРИДРИХА
  {
    // Точка без склада в «МойСклад» — публикуется справочно, id
    // синхронен с server/data/extra-stores.ts.
    id: "bunker-store-engels-chapaeva-45",
    cityId: "engels",
    name: "Чапаева, 45",
    address: "ул. Чапаева, 45",
  },
];

export const storeLocations: readonly StoreLocation[] = storeDrafts.map(
  (store) => {
    const geo = geoById[store.id];
    if (!geo) {
      return store;
    }
    return {
      ...store,
      coordinates: geo.coordinates,
      geoSource: geo.source,
      mapsUrl: store.mapsUrl ?? geo.mapsUrl,
    };
  },
);

export const storeLocationById = new Map(
  storeLocations.map((store) => [store.id, store]),
);
