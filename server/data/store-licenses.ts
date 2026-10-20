import type { StoreLicense } from "../../shared/types/store";

/**
 * Реквизиты лицензий на розничную продажу табачной и никотинсодержащей
 * продукции по торговым объектам (186-ФЗ от 26.06.2026).
 *
 * TODO(данные владельца): заполнить после получения лицензий: ключ — id
 * склада МойСклад (см. server/data/store-addresses.ts), значение —
 * реквизиты лицензии.
 */
export const storeLicenses: Readonly<Record<string, StoreLicense>> = {};
