/**
 * Бонусная программа «МойСклад» — чтение правил и баланса (без записей).
 *
 * Механизм подтверждён документацией JSON API remap 1.2: сущность
 * «Бонусная программа» (entity/bonusprogram) задаёт курсы и лимиты,
 * бонусный балланс контрагента читается из поля bonusPoints, участие —
 * из поля bonusProgram контрагента. Начисление и списание выполняет
 * персонал «МойСклад» (в магазине, при продаже): сайт не создаёт бонусные
 * операции и не списывает баллы дистанционно — выбранная модель повторяет
 * ProHook и не нарушает запрет дистанционной продажи (15-ФЗ ст. 19).
 *
 * Выбор программы при нескольких активных: MOYSKLAD_BONUS_PROGRAM_ID (id)
 * или MOYSKLAD_BONUS_PROGRAM_NAME (точное имя), иначе первая активная.
 */
import { moyskladFetch } from "./moysklad";
import {
  findCounterpartyByPhone,
  getCounterpartyById,
  type MoyskladCounterparty,
} from "./moysklad-counterparty";

export interface BonusProgramTerms {
  id: string;
  name: string;
  /** Курс начисления: столько рублей покупки = 1 балл. */
  earnRateRoublesToPoint: number;
  /** Курс списания: столько баллов = 1 рубль скидки. */
  spendRatePointsToRouble: number;
  /** Максимальная доля покупки, оплачиваемая баллами, в процентах. */
  maxPaidRatePercents: number;
  /** Разрешено одновременное начисление и списание. */
  earnWhileRedeeming: boolean;
  welcomeBonusesEnabled: boolean;
  welcomeBonusesValue?: number;
  /** Отложенное начисление, дней (опция «Расширенная бонусная программа»). */
  postponedBonusesDelayDays?: number;
}

interface MsBonusProgram {
  id: string;
  name: string;
  active?: boolean;
  earnRateRoublesToPoint?: number;
  spendRatePointsToRouble?: number;
  maxPaidRatePercents?: number;
  earnWhileRedeeming?: boolean;
  welcomeBonusesEnabled?: boolean;
  welcomeBonusesValue?: number;
  postponedBonusesDelayDays?: number;
}

/** Токен «МойСклад» настроен (иначе бонусный блок честно недоступен). */
export function isBonusConfigured(): boolean {
  return Boolean(process.env.NUXT_MOYSKLAD_TOKEN || process.env.MOYSKLAD_TOKEN);
}

/**
 * Фикстурный режим e2e-тестов (MOYSKLAD_SNAPSHOT_PATH, как у каталога):
 * реальные запросы к «МойСклад» не выполняются, бонусы отвечают
 * детерминированными тестовыми данными. В production-конфигурации без
 * этой переменной ветка недостижима — фиктивных балансов не бывает.
 */
function fixtureMode(): boolean {
  return Boolean(process.env.MOYSKLAD_SNAPSHOT_PATH);
}

const FIXTURE_TERMS: BonusProgramTerms = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Тестовая бонусная программа",
  earnRateRoublesToPoint: 50,
  spendRatePointsToRouble: 1,
  maxPaidRatePercents: 50,
  earnWhileRedeeming: false,
  welcomeBonusesEnabled: false,
};

/** Фикстурный режим включён (e2e-тесты без живого «МойСклад»). */
export function isFixtureMode(): boolean {
  return fixtureMode();
}

/** Телефон e2e-пользователя с предустановленным тестовым балансом. */
const FIXTURE_BONUS_PHONE = "79000000001";
const FIXTURE_BONUS_BALANCE = 500;

let programCache:
  { expires: number; terms: BonusProgramTerms | null } | undefined;

/** Условия бонусной программы аккаунта (5-минутный кеш). null — нет активных. */
export async function getBonusProgramTerms(): Promise<BonusProgramTerms | null> {
  if (programCache && programCache.expires > Date.now())
    return programCache.terms;
  let terms: BonusProgramTerms | null = null;
  try {
    const response = await moyskladFetch(
      "/api/remap/1.2/entity/bonusprogram?limit=100",
      20000,
    );
    const page = (await response.json()) as { rows?: MsBonusProgram[] };
    const rows = page.rows ?? [];
    const wantedId = process.env.MOYSKLAD_BONUS_PROGRAM_ID?.trim();
    const wantedName = process.env.MOYSKLAD_BONUS_PROGRAM_NAME?.trim();
    const selected =
      (wantedId ? rows.find((row) => row.id === wantedId) : undefined) ??
      (wantedName
        ? rows.find((row) => row.name.trim() === wantedName)
        : undefined) ??
      rows.find((row) => row.active);
    if (selected) {
      terms = {
        id: selected.id,
        name: selected.name,
        earnRateRoublesToPoint: selected.earnRateRoublesToPoint ?? 0,
        spendRatePointsToRouble: selected.spendRatePointsToRouble ?? 0,
        maxPaidRatePercents: selected.maxPaidRatePercents ?? 0,
        earnWhileRedeeming: Boolean(selected.earnWhileRedeeming),
        welcomeBonusesEnabled: Boolean(selected.welcomeBonusesEnabled),
        ...(selected.welcomeBonusesValue !== undefined
          ? { welcomeBonusesValue: selected.welcomeBonusesValue }
          : {}),
        ...(selected.postponedBonusesDelayDays !== undefined
          ? { postponedBonusesDelayDays: selected.postponedBonusesDelayDays }
          : {}),
      };
    }
  } catch (error) {
    console.error(
      "Moysklad bonus program fetch failed:",
      error instanceof Error ? error.message : "unknown error",
    );
  }
  programCache = { expires: Date.now() + 5 * 60 * 1000, terms };
  return terms;
}

export interface LoyaltySummary {
  /** Контрагент «МойСклад», привязанный к телефону покупателя. */
  counterpartyId: string;
  counterpartyName: string;
  /** Балланс бонусных баллов (0, если программа не привязана). */
  balance: number;
  /** Контрагент участвует в бонусной программе. */
  enrolled: boolean;
  terms: BonusProgramTerms | null;
}

/**
 * Бонусный профиль покупателя: правила программы + балланс его контрагента.
 * counterpartyId передан, когда привязка уже сохранена в профиле; иначе
 * выполняется ленивый поиск по телефону (карту могли выпустить позже).
 */
export async function getLoyaltySummary(input: {
  phone: string;
  counterpartyId?: string | null;
}): Promise<
  | { ok: true; summary: LoyaltySummary | null }
  | { ok: false; reason: "not-configured" | "unavailable" }
> {
  if (fixtureMode()) {
    if (input.phone !== FIXTURE_BONUS_PHONE) return { ok: true, summary: null };
    return {
      ok: true,
      summary: {
        counterpartyId: "00000000-0000-4000-8000-000000000002",
        counterpartyName: "Тестовый покупатель",
        balance: FIXTURE_BONUS_BALANCE,
        enrolled: true,
        terms: FIXTURE_TERMS,
      },
    };
  }
  if (!isBonusConfigured()) return { ok: false, reason: "not-configured" };
  let counterparty: MoyskladCounterparty | null;
  if (input.counterpartyId) {
    counterparty = await getCounterpartyById(input.counterpartyId);
  } else {
    const search = await findCounterpartyByPhone(input.phone);
    if (!search.ok) return { ok: false, reason: "unavailable" };
    counterparty = search.counterparty;
  }
  const terms = await getBonusProgramTerms();
  if (!counterparty) return { ok: true, summary: null };
  return {
    ok: true,
    summary: {
      counterpartyId: counterparty.id,
      counterpartyName: counterparty.name,
      balance: Math.trunc(counterparty.bonusPoints ?? 0),
      enrolled: Boolean(counterparty.bonusProgram?.meta?.href),
      terms,
    },
  };
}
