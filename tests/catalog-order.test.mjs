import { test } from "node:test";
import assert from "node:assert/strict";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);
const { orderCatalogCategories } = await jiti.import(
  "../server/utils/catalog-order.ts",
);

const category = (id, name, parentId = null) => ({
  id,
  name,
  slug: id,
  description: "",
  parentId,
  agePublic: false,
});

test("порядок каталога: корни по товарам всей ветви, дети по алфавиту", () => {
  // Живой кейс «Бункера»: у «Табака для кальяна» почти все товары лежат
  // в подпапках брендов — провал корня в конец списка и был багом.
  const categories = [
    category("lighters", "Зажигалки"),
    category("hookah-tobacco", "Табак для кальяна"),
    category("hookah-tobacco-brand", "Adalyia", "hookah-tobacco"),
    category("hookah-tobacco-brand-2", "Brusko", "hookah-tobacco"),
    category("aroma", "Ароматизаторы"),
    category("devices", "Устройства"),
  ];
  const products = [
    ...Array.from({ length: 7 }, () => ({
      categoryId: "hookah-tobacco-brand",
    })),
    ...Array.from({ length: 5 }, () => ({
      categoryId: "hookah-tobacco-brand-2",
    })),
    ...Array.from({ length: 4 }, () => ({ categoryId: "aroma" })),
    ...Array.from({ length: 2 }, () => ({ categoryId: "devices" })),
    ...Array.from({ length: 1 }, () => ({ categoryId: "lighters" })),
  ];
  const ordered = orderCatalogCategories(categories, products);
  assert.deepEqual(
    ordered.map((item) => item.name),
    [
      // 12 = 7 + 5 товаров ветви «Табака для кальяна» — первый корень.
      "Табак для кальяна",
      "Ароматизаторы",
      "Устройства",
      "Зажигалки",
      // Дети — по алфавиту, после корней.
      "Adalyia",
      "Brusko",
    ],
  );
});

test("равные ветви и пустые корни: добор по алфавиту (ru)", () => {
  const categories = [
    category("b", "Снеки"),
    category("a", "Одноразовые ЭС"),
    category("c", "Другое"),
  ];
  const ordered = orderCatalogCategories(categories, [
    { categoryId: "a" },
    { categoryId: "b" },
  ]);
  // «Одноразовые ЭС» и «Снеки» равны (по 1) — алфавит; пустой «Другое» — в конце.
  assert.deepEqual(
    ordered.map((item) => item.name),
    ["Одноразовые ЭС", "Снеки", "Другое"],
  );
});

test("порядок устойчив к одинаковым именам, глубоким ветвям и петлям", () => {
  // Два «Табака для кальяна» (корень и чей-то ребёнок), ветвь глубиной 3,
  // петля parentId не должна зациклить подсчёт (товар петли не считается
  // ни в один корень, сама пара остаётся в детях).
  const categories = [
    category("root-2", "Другое"),
    category("deep-1", "Уровень 1", "root-1"),
    category("deep-2", "Уровень 2", "deep-1"),
    category("deep-3", "Уровень 3", "deep-2"),
    category("root-1", "Табак для кальяна"),
    category("same-name", "Табак для кальяна", "root-2"),
    category("loop-a", "Петля А", "loop-b"),
    category("loop-b", "Петля Б", "loop-a"),
  ];
  const ordered = orderCatalogCategories(categories, [
    { categoryId: "deep-3" }, // три уровня вниз → корень root-1
    { categoryId: "same-name" }, // прямой товар ребёнка → корень root-2
    { categoryId: "loop-a" }, // петля: ни один узел не корень
  ]);
  assert.deepEqual(
    ordered.map((item) => item.name),
    [
      // Корни: 1=1 → алфавит («Другое» < «Табак…»).
      "Другое",
      "Табак для кальяна",
      // Дети по алфавиту: П < Т < У.
      "Петля А",
      "Петля Б",
      "Табак для кальяна",
      "Уровень 1",
      "Уровень 2",
      "Уровень 3",
    ],
  );
});
