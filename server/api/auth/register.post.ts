import { validateRegistration } from "../../../shared/utils/account";
import { toSessionUser } from "../../../shared/utils/account";
import { allowRegister } from "../../utils/auth-rate-limit";
import { guardJsonRequest } from "../../utils/request-guard";
import { startSession } from "../../utils/session";
import {
  createUser,
  findUserByPhone,
  updateUser,
} from "../../services/user-store";
import { findCounterpartyByPhone } from "../../services/moysklad-counterparty";

export default defineEventHandler(async (event) => {
  const body = await guardJsonRequest(event, 16384);
  if (!allowRegister(getRequestIP(event) ?? "unknown")) {
    setResponseHeader(event, "Retry-After", 900);
    throw createError({ statusCode: 429, statusMessage: "Too many requests" });
  }
  const { data, errors, valid } = validateRegistration(body);
  if (!valid)
    throw createError({
      statusCode: 422,
      statusMessage: "Invalid fields",
      data: { errors },
    });
  if (await findUserByPhone(data.phone)) {
    // Без подтверждения enumeration: формулировка допускает обе причины.
    throw createError({
      statusCode: 409,
      statusMessage: "Phone unavailable",
      data: {
        errors: {
          phone:
            "Регистрация с этим номером недоступна. Возможно, вы уже регистрировались — попробуйте войти.",
        },
      },
    });
  }
  let user;
  try {
    user = await createUser(data);
  } catch (error) {
    // Единственная ожидаемая причина — гонка с параллельной регистрацией.
    if (error instanceof Error && error.message === "Phone already registered")
      throw createError({
        statusCode: 409,
        statusMessage: "Phone unavailable",
      });
    console.error(
      "Registration failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    throw createError({
      statusCode: 500,
      statusMessage: "Registration failed",
    });
  }
  // Привязка к контрагенту «МойСклад» по телефону — best effort:
  // контрагента заводит персонал при выпуске бонусной карты, регистрация
  // сайта клиентов в учёте не создаёт. Сбой привязки регистрацию не ломает.
  // В фикстурном режиме e2e живой API не вызывается.
  if (!user.moyskladCounterpartyId && !process.env.MOYSKLAD_SNAPSHOT_PATH) {
    const found = await findCounterpartyByPhone(user.phone);
    if (found.ok && found.counterparty)
      user =
        (await updateUser(user.id, {
          moyskladCounterpartyId: found.counterparty.id,
        })) ?? user;
  }
  await startSession(event, user.id);
  return { user: toSessionUser(user) };
});
