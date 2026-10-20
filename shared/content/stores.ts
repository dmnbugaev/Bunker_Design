import type { City, StoreLocation } from "~~/shared/types/store";
import storeCoordinatesJson from "./store-coordinates.json";

/**
 * Публичный список физических точек сети «Бункер» для страницы контактов.
 *
 * TODO(данные владельца): адреса точек сети не предоставлены. Основной
 * источник магазинов для сайта — склады аккаунта «МойСклад» Бункера
 * (server/services/moysklad.ts); этот файл дополняет их координатами и
 * вручную заданными городами. Заполнить список по docs/NEEDS-DATA.md:
 * каждая точка — { id, cityId, name, address }.
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

/**
 * Города сети. TODO(данные владельца): пока список пуст, города на сайте
 * группируются по группам складов «МойСклад» (pathName). После получения
 * данных зафиксировать список здесь.
 */
export const storeCities: readonly City[] = [];

type StoreLocationDraft = Omit<StoreLocation, "coordinates" | "geoSource">;

/** TODO(данные владельца): адреса точек сети «Бункер» не предоставлены. */
const storeDrafts: readonly StoreLocationDraft[] = [];

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
