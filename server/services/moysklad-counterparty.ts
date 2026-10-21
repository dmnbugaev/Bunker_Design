/**
 * Контрагенты «МойСклад» — привязка покупателя сайта к клиенту учёта.
 *
 * Модель (повторяет ProHook): сайт НЕ создаёт контрагентов в «МойСклад» —
 * клиент заводится персоналом при выпуске бонусной карты в магазине,
 * «МойСклад» остаётся источником истины. Сайт лишь находит контрагента по
 * телефону и читает его бонусные поля (балланс — server/services/moysklad-bonus.ts).
 *
 * Все запросы идут через server-side адаптер: токен не покидает сервер.
 */
import { moyskladFetch } from "./moysklad";

export interface MoyskladCounterparty {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  /** Бонусные баллы по активной бонусной программе (только чтение). */
  bonusPoints?: number;
  /** Метаданные активной бонусной программы контрагента. */
  bonusProgram?: { meta?: { href?: string } };
  /** Номер дисконтной карты. */
  discountCardNumber?: string;
}

/** Привести телефон к последовательности цифр для сопоставления. */
function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Ключ сопоставления — последние 10 цифр номера: записи «МойСклад» могут
 * хранить российский номер с префиксом 8, сайт — с 7 (аккаунт «Бункера»
 * ведёт телефоны контрагентов в формате 8…).
 */
function phoneKey(phone: string): string {
  const digits = phoneDigits(phone);
  return digits.length > 10 ? digits.slice(-10) : digits;
}

/**
 * Поиск контрагента по номеру телефона. Контекстный search «МойСклад» ищет
 * по множеству полей (имя, код, email, телефоны контактных лиц), поэтому
 * после поиска строка сверяется по нормализованным цифрам телефонов
 * контрагента — исключаются совпадения по имени/коду.
 *
 * Возвращает null, если контрагент не найден; ok:false — при недоступности
 * API (сеть/токен), чтобы вызывающий код отличал «нет клиента» от «сервис
 * недоступен».
 */
export async function findCounterpartyByPhone(
  phone: string,
): Promise<
  { ok: true; counterparty: MoyskladCounterparty | null } | { ok: false }
> {
  const needle = phoneDigits(phone);
  if (!needle) return { ok: true, counterparty: null };
  let response: Response;
  try {
    const params = new URLSearchParams({ search: needle, limit: "50" });
    response = await moyskladFetch(`entity/counterparty?${params}`, 20000);
  } catch (error) {
    console.error(
      "Moysklad counterparty search failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return { ok: false };
  }
  const page = (await response.json()) as { rows?: MoyskladCounterparty[] };
  const rows = page.rows ?? [];
  const matched = rows.find(
    (row) => row.phone && phoneKey(row.phone) === phoneKey(phone),
  );
  return { ok: true, counterparty: matched ?? null };
}

/** Контрагент по id с бонусными полями. */
export async function getCounterpartyById(
  id: string,
): Promise<MoyskladCounterparty | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  try {
    const response = await moyskladFetch(
      `/api/remap/1.2/entity/counterparty/${id}`,
      20000,
    );
    return (await response.json()) as MoyskladCounterparty;
  } catch (error) {
    console.error(
      "Moysklad counterparty fetch failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return null;
  }
}
