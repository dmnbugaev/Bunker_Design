import type { Store } from "../../shared/types/store";

/**
 * Точки сети «Бункер» без склада в аккаунте «МойСклад»: публикуются
 * справочно — адрес, город и режим сети, без цен и наличия (офферы
 * каталога строятся только по учётным складам).
 *
 * «Чапаева, 45» (Энгельс) — из списка владелицы 24.10.2026; склад в
 * аккаунте не заведён (docs/NEEDS-DATA.md). id синтетический, стабильный:
 * попадает в cookie выбора магазина и JSON-LD, но не пересекается с id
 * складов «МойСклад» (uuid).
 */
export const extraStores: readonly Store[] = [
  {
    id: "bunker-store-engels-chapaeva-45",
    cityId: "engels",
    name: "Чапаева, 45",
    description: "Магазин сети Бункер",
    address: "ул. Чапаева, 45",
  },
];

/** Города точек без склада: регистрируются в мете каталога как обычные. */
export const extraStoreCities: Readonly<Record<string, string>> = {
  engels: "Энгельс",
};
