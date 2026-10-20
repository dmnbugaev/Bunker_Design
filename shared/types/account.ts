/**
 * Публичная (клиентская) форма пользователя сессии.
 * Пароль, хеш и внутренние поля хранилища сюда не попадают.
 */
export interface SessionUser {
  id: string;
  /** Нормализованный телефон: 7XXXXXXXXXX. */
  phone: string;
  lastName: string;
  firstName: string;
  middleName: string;
  /** ISO-дата: YYYY-MM-DD. */
  dateOfBirth: string;
  /** true, если 18 лет уже исполнилось (точное сравнение дат). */
  isAdult: boolean;
  /**
   * Единый признак для UI: можно ли показывать изображения товаров.
   * Совпадает с серверной проверкой в /api/products/:id/images/:index.
   */
  canViewProductImages: boolean;
  /** Связь с контрагентом «МойСклад» (бонусным счётом) установлена. */
  loyaltyLinked: boolean;
  createdAt: string;
}

/** Ответ GET /api/auth/me. */
export interface MeResponse {
  user: SessionUser | null;
  /**
   * true для аккаунтов из allowlist STAFF_INBOX_PHONES: в личном кабинете
   * появляется инбокс заявок (резервы + партнёрство) — резервный канал,
   * пока Telegram-уведомления недоступны с хостинга.
   */
  staffInbox?: boolean;
}

export type LoyaltyAvailability =
  "ok" | "unlinked" | "unavailable" | "unauthorized";

/** Условия бонусной программы «МойСклад» (только чтение). */
export interface LoyaltyProgramTerms {
  name: string;
  /** Курс начисления: столько рублей покупки = 1 балл. */
  earnRateRoublesToPoint: number;
  /** Курс списания: столько баллов = 1 рубль скидки. */
  spendRatePointsToRouble: number;
  /** Максимальная доля покупки, оплачиваемая баллами, в процентах. */
  maxPaidRatePercents: number;
  earnWhileRedeeming: boolean;
}

/** Ответ GET /api/account/loyalty. */
export interface LoyaltyResponse {
  status: LoyaltyAvailability;
  /** Целое число бонусных баллов (status === "ok"). */
  balance?: number;
  /** Имя контрагента «МойСклад» (status === "ok"). */
  counterpartyName?: string;
  /** Контрагент участвует в бонусной программе. */
  enrolled?: boolean;
  /** Условия программы из аккаунта «МойСклад», если получены. */
  program?: LoyaltyProgramTerms;
  message?: string;
}
