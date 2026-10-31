import { test } from "node:test";
import assert from "node:assert/strict";
import { createJiti } from "jiti";

// Модуль moysklad.ts импорто-безопасен: сетевых вызовов на верхнем уровне
// нет, fetchCatalog/fetchStock вызываются только явно.
const jiti = createJiti(import.meta.url);
const { displayNameForFolder } = await jiti.import(
  "../server/services/moysklad.ts",
);

test("публичные имена папок: карта переопределяет учётные, остальное как есть", () => {
  // Кейс аккаунта «Бункера»: корень «СИГАРЕТЫ» капсом → публично «Сигареты».
  assert.equal(displayNameForFolder("СИГАРЕТЫ"), "Сигареты");
  // Нормализация ключа как в классификации: регистр и лишние пробелы.
  assert.equal(displayNameForFolder("  сигареты "), "Сигареты");
  // Имена без переопределения не трогаем — включая похожие и подкатегории.
  assert.equal(displayNameForFolder("СИГАРЕТЫ EXTRA"), "СИГАРЕТЫ EXTRA");
  assert.equal(displayNameForFolder("Табак для кальяна"), "Табак для кальяна");
  assert.equal(displayNameForFolder("Adalyia"), "Adalyia");
});
