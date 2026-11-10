import { test } from "node:test";
import assert from "node:assert/strict";
import { createJiti } from "jiti";

// catalog-cache импорто-безопасен: сетевых вызовов на верхнем уровне нет,
// refresh-функции не задействуются — тестируется только перенос даты.
const { retainPublishedAt } = await createJiti(import.meta.url).import(
  "../server/services/catalog-cache.ts",
);

const product = (id, publishedAt) => ({
  id,
  slug: id,
  sku: id,
  name: `Товар ${id}`,
  categoryId: "c",
  images: [],
  description: "",
  attributes: [],
  offers: [
    { storeId: "st1", price: 100000, currency: "RUB", availability: "plenty" },
  ],
  publishedAt,
});

const snapshot = (products) => ({
  updatedAt: 0,
  stockUpdatedAt: 0,
  meta: { cities: [], stores: [], categories: [], brands: [], materials: [] },
  products,
});

test("правка старого товара не меняет его дату публикации", () => {
  // Старый товар с датой первого появления; в свежей выгрузке его updated
  // уже «сегодня» (правили цену), но publishedAt обязан остаться прежним.
  const previous = snapshot([
    product("old", "2026-01-01T00:00:00Z"),
    product("gone", "2026-01-01T00:00:00Z"),
  ]);
  const next = snapshot([
    product("old", "2026-11-11T00:00:00Z"),
    product("new", "2026-11-10T00:00:00Z"),
  ]);
  const result = retainPublishedAt(next, previous);
  assert.equal(
    result.products.find((item) => item.id === "old").publishedAt,
    "2026-01-01T00:00:00Z",
  );
  // Новый товар — первый раз в выгрузке: дата берётся из «МойСклад» как есть.
  assert.equal(
    result.products.find((item) => item.id === "new").publishedAt,
    "2026-11-10T00:00:00Z",
  );
});

test("без предыдущего снимка даты не трогаются", () => {
  // Первый запуск: кеша ещё нет, каждая дата остаётся своей.
  const next = snapshot([
    product("a", "2026-11-11T00:00:00Z"),
    product("b", ""),
  ]);
  const result = retainPublishedAt(next, undefined);
  assert.equal(
    result.products.find((item) => item.id === "a").publishedAt,
    "2026-11-11T00:00:00Z",
  );
  assert.equal(result.products.find((item) => item.id === "b").publishedAt, "");
});

test("дата переносится через цепочку обновлений, но не через разрыв", () => {
  // Ряд последовательных обновлений (TTL 5 минут) — дата первого
  // появления переживает каждое из них, что бы ни делали с товаром.
  const day1 = snapshot([product("item", "2026-01-01T00:00:00Z")]);
  const day2 = retainPublishedAt(
    snapshot([product("item", "2026-06-01T00:00:00Z")]),
    day1,
  );
  const day3 = retainPublishedAt(
    snapshot([product("item", "2026-11-11T00:00:00Z")]),
    day2,
  );
  assert.equal(
    day3.products.find((item) => item.id === "item").publishedAt,
    "2026-01-01T00:00:00Z",
  );
  // Товар, исчезнувший из выгрузки и вернувшийся, — для снимка «новый»:
  // истории переноса нет, дата берётся из «МойСклад» заново.
  const afterGap = retainPublishedAt(
    snapshot([product("item", "2026-11-11T00:00:00Z")]),
    snapshot([]),
  );
  assert.equal(
    afterGap.products.find((item) => item.id === "item").publishedAt,
    "2026-11-11T00:00:00Z",
  );
});
