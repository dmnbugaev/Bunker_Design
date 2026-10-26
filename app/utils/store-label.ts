import type { Store } from "~~/shared/types/store";

/** Шаблонное описание из МойСклада не помогает выбрать точку — прячем. */
const GENERIC_DESCRIPTION = /^магазин сети/i;

/** Служебные слова адреса, не влияющие на сравнение «имя ≈ адрес». */
const ADDRESS_STOP_WORDS = new Set([
  "ул",
  "улица",
  "проспект",
  "пр",
  "пл",
  "площадь",
  "шоссе",
  "имени",
  "в",
  "г",
  "гор",
]);

function words(value: string): string[] {
  return value
    .toLocaleLowerCase("ru")
    .replace(/ё/g, "е")
    .split(/[^a-zа-я0-9]+/)
    .filter((word) => word && !ADDRESS_STOP_WORDS.has(word));
}

/**
 * Короткое имя точки («Рахова, 64/70а») уже называет адрес: сравниваем
 * значимые слова, чтобы не печатать одну и ту же улицу дважды.
 */
function nameCoversAddress(name: string, address: string): boolean {
  const nameWords = words(name);
  const addressWords = words(address);
  return (
    nameWords.length > 0 &&
    nameWords.every((word) => addressWords.includes(word))
  );
}

/**
 * Подпись-улица под названием точки: почтовый боилерплейт (индекс, страна,
 * регион, «г Город») отрезаем; адрес-дубль короткого имени не повторяем,
 * а без адреса остаётся осмысленное описание точки.
 */
export function storeAddressLine(
  store: Pick<Store, "name" | "address" | "description">,
): string {
  const parts = (store.address ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(
      (part) =>
        part &&
        !/^\d{6}$/.test(part) &&
        !/^россия$/i.test(part) &&
        !/(обл|республик|край|автономн)/i.test(part) &&
        !/^(г|гор|п)\.?\s/i.test(part),
    );
  const address = parts.join(", ");
  if (address && !nameCoversAddress(store.name, address)) return address;
  const description = store.description?.trim() ?? "";
  return GENERIC_DESCRIPTION.test(description) ? "" : description;
}
