import assert from "node:assert/strict";
import { test } from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);
const { storeLocations, storeCities } = await jiti.import(
  "../shared/content/stores.ts",
);
const { storeAddresses } = await jiti.import(
  "../server/data/store-addresses.ts",
);
const coordinates = await jiti.import(
  "../shared/content/store-coordinates.json",
);

const cityNames = Object.fromEntries(
  storeCities.map((city) => [city.id, city.name]),
);

// Локальное обогащение магазинов (shared/content/stores.ts) наполняется
// данными владельца (docs/NEEDS-DATA.md); магазины сети при этом всегда
// приходят из «МойСклад». Пока списки пусты, инварианты ниже тривиально
// зелёные — они включаются по мере заполнения.

test("публичный список: id уникальны, города согласованы", () => {
  const ids = new Set();
  for (const store of storeLocations) {
    assert.ok(store.id.length > 0, "пустой id");
    assert.ok(!ids.has(store.id), `дублирующийся id: ${store.id}`);
    ids.add(store.id);
    assert.ok(store.name.length > 0, `пустое name у ${store.id}`);
    assert.ok(store.address.length > 0, `пустое address у ${store.id}`);
    assert.ok(cityNames[store.cityId], `неизвестный cityId у ${store.id}`);
  }
  assert.equal(
    new Set(storeCities.map((city) => city.id)).size,
    storeCities.length,
  );
});

test("адреса согласованы с учётным списком store-addresses.ts", () => {
  const publicAddresses = storeLocations.map((store) => store.address);
  for (const address of Object.values(storeAddresses)) {
    const street = address.split(" — ")[0].trim();
    const matched = publicAddresses.some(
      (candidate) =>
        candidate === street ||
        candidate.includes(street) ||
        street.includes(candidate),
    );
    assert.ok(
      matched,
      `адрес из учёта не найден в публичном списке: ${address}`,
    );
  }
});

test("координаты корректны и лежат в границах России", () => {
  for (const store of storeLocations) {
    const geo = coordinates[store.id];
    if (!geo) continue;
    assert.ok(
      Array.isArray(geo.coordinates) && geo.coordinates.length === 2,
      `кривые координаты у ${store.id}`,
    );
    const [lng, lat] = geo.coordinates;
    assert.equal(
      typeof geo.source,
      "string",
      `нет источника координат у ${store.id}`,
    );
    // Грубая рамка РФ: защита от перепутанных широты/долготы и опечаток.
    assert.ok(
      lng >= 19 && lng <= 190 && lat >= 41 && lat <= 82,
      `координаты ${store.id} вне границ России: ${lng}, ${lat}`,
    );
  }
});

test("в sidecar нет записей про несуществующие магазины", () => {
  const ids = new Set(storeLocations.map((store) => store.id));
  for (const id of Object.keys(coordinates)) {
    assert.ok(ids.has(id), `в sidecar лишний id: ${id}`);
  }
});
