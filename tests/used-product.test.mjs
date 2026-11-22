import { test } from "node:test";
import assert from "node:assert/strict";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);
const { isUsedProduct, usedCategoryIds } = await jiti.import(
  "../shared/utils/product.ts",
);

const category = (id, name, parentId = null) => ({ id, name, parentId });

// Дерево как в живом МойСклад: корень «Vape Express» с потомками и посторонний
// корень рядом (нормализация имён — как в classifyRootCategory).
const categories = [
  category("cat-vex", "Vape Express"),
  category("cat-vex-smoant", "Smoant", "cat-vex"),
  category("cat-vex-older", "Прежние модели", "cat-vex-smoant"),
  category("cat-liquids", "Жидкости"),
  category("cat-salt", "Солевые", "cat-liquids"),
];

test("usedCategoryIds собирает корень б/у со всеми потомками", () => {
  const ids = usedCategoryIds(categories);
  assert.equal(ids.size, 3);
  for (const id of ["cat-vex", "cat-vex-smoant", "cat-vex-older"])
    assert.ok(ids.has(id), `${id} должен входить в ветку б/у`);
  assert.ok(!ids.has("cat-liquids"));
  assert.ok(!ids.has("cat-salt"));
});

test("прежнее имя корня распознаётся с точностью до регистра и пробелов", () => {
  const ids = usedCategoryIds([
    category("cat-vex-old", "  Б/у   УСТРОЙСТВА (VEX) "),
    category("cat-vex-old-kid", "Voopoo", "cat-vex-old"),
  ]);
  assert.ok(ids.has("cat-vex-old"));
  assert.ok(ids.has("cat-vex-old-kid"));
});

test("isUsedProduct сверяет категорию товара с веткой б/у", () => {
  assert.equal(isUsedProduct({ categoryId: "cat-vex" }, categories), true);
  assert.equal(
    isUsedProduct({ categoryId: "cat-vex-older" }, categories),
    true,
  );
  assert.equal(isUsedProduct({ categoryId: "cat-salt" }, categories), false);
  assert.equal(isUsedProduct({ categoryId: "missing" }, categories), false);
  assert.equal(isUsedProduct({ categoryId: "" }, categories), false);
});
