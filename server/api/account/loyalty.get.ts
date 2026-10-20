import { requireStoredUser } from "../../utils/session";
import {
  getLoyaltySummary,
  isFixtureMode,
} from "../../services/moysklad-bonus";
import { findCounterpartyByPhone } from "../../services/moysklad-counterparty";
import { updateUser } from "../../services/user-store";

const UNAVAILABLE = {
  status: "unavailable" as const,
  message: "Не удалось загрузить информацию о бонусах. Попробуйте позже.",
};

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  const user = await requireStoredUser(event);
  // Ленивая привязка: контрагента могли завести в «МойСклад» уже после
  // регистрации (при выпуске бонусной карты в магазине). В фикстурном
  // режиме e2e поиск по живому API не выполняется.
  let counterpartyId = user.moyskladCounterpartyId;
  if (!counterpartyId && !isFixtureMode()) {
    const found = await findCounterpartyByPhone(user.phone);
    if (!found.ok) {
      throw createError({
        statusCode: 503,
        statusMessage: "Loyalty unavailable",
        data: UNAVAILABLE,
      });
    }
    if (found.counterparty) {
      counterpartyId = found.counterparty.id;
      await updateUser(user.id, { moyskladCounterpartyId: counterpartyId });
    }
  }
  const loyalty = await getLoyaltySummary({
    phone: user.phone,
    counterpartyId,
  });
  if (!loyalty.ok) {
    if (loyalty.reason === "not-configured") {
      throw createError({
        statusCode: 503,
        statusMessage: "Loyalty unavailable",
        data: UNAVAILABLE,
      });
    }
    throw createError({
      statusCode: 503,
      statusMessage: "Loyalty unavailable",
      data: UNAVAILABLE,
    });
  }
  if (!loyalty.summary) {
    // Контрагента в «МойСклад» нет: карта оформляется персоналом в магазине,
    // сайт клиентов не заводит — учёт остаётся источником истины.
    return {
      status: "unlinked" as const,
      message:
        "Бонусная карта пока не привязана. Оформите карту в магазине сети — после этого баланс появится здесь автоматически.",
    };
  }
  const { terms, ...rest } = loyalty.summary;
  return {
    status: "ok" as const,
    ...rest,
    ...(terms
      ? {
          program: {
            name: terms.name,
            earnRateRoublesToPoint: terms.earnRateRoublesToPoint,
            spendRatePointsToRouble: terms.spendRatePointsToRouble,
            maxPaidRatePercents: terms.maxPaidRatePercents,
            earnWhileRedeeming: terms.earnWhileRedeeming,
          },
        }
      : {}),
  };
});
