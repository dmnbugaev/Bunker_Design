import { type Partnership } from "../../shared/utils/partnership";

export function partnershipMessage(data: Partnership, id: string) {
  return [
    "Новая заявка на партнёрство · Бункер",
    `Заявка: ${id}`,
    "",
    `ФИО: ${data.name}`,
    `Телефон: ${data.phone}`,
    `Город / регион: ${data.city}`,
    `Компания: ${data.company}`,
    `Предложение: ${data.offer}`,
    "Согласие на обработку персональных данных: получено",
    "Согласие на передачу через Telegram: получено",
  ].join("\n");
}

// Nuxt coerces numeric env values (e.g. NUXT_TELEGRAM_CHAT_ID=6939112736) to numbers.
export function parseTelegramChatIds(raw: string | number) {
  return String(raw ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Доставка персональных данных через api.telegram.org реально настроена
 * (токен + хотя бы один чат резерва или партнёрства). Только в этом случае
 * формам нужно обязательное согласие на трансграничную передачу; без
 * Telegram запросы уходят задачей в МойСклад и согласие не требуется.
 */
export function isTelegramDeliveryConfigured(): boolean {
  // Резервы читают сырые env, партнёрская форма — NUXT_-маппинг runtimeConfig
  // (telegramBotToken/telegramChatId): учитываем оба варианта.
  const token =
    process.env.TELEGRAM_BOT_TOKEN?.trim() ||
    process.env.NUXT_TELEGRAM_BOT_TOKEN?.trim() ||
    "";
  if (!token) return false;
  const reservationChats = parseTelegramChatIds(
    process.env.TELEGRAM_RESERVATION_CHAT_IDS ?? "",
  ).length;
  const partnershipChats = parseTelegramChatIds(
    process.env.TELEGRAM_PARTNERSHIP_CHAT_IDS ??
      process.env.TELEGRAM_CHAT_ID ??
      process.env.NUXT_TELEGRAM_CHAT_ID ??
      "",
  ).length;
  return reservationChats + partnershipChats > 0;
}

/** api.telegram.org недоступен на сетевом уровне (DNS/TCP) — ретраи бессмысленны. */
export class TelegramUnreachableError extends Error {}

export async function sendPartnership(
  token: string,
  chatIds: string[],
  data: Partnership,
  id: string,
  request: typeof fetch = fetch,
): Promise<string[]> {
  // Plain text deliberately avoids interpreting user input as Telegram markup.
  const deliveredTo: string[] = [];
  let networkFailures = 0;
  for (const chatId of chatIds) {
    try {
      const response = await request(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: partnershipMessage(data, id),
            link_preview_options: { is_disabled: true },
          }),
          signal: AbortSignal.timeout(10000),
        },
      );
      const result = (await response.json()) as {
        ok?: boolean;
        result?: { message_id?: number };
      };
      if (
        response.ok &&
        result.ok === true &&
        typeof result.result?.message_id === "number"
      ) {
        deliveredTo.push(chatId);
      }
    } catch (error) {
      if (error instanceof TypeError) networkFailures++;
      // One unreachable chat must not block delivery to the others.
    }
  }
  if (deliveredTo.length === 0) {
    if (networkFailures > 0) throw new TelegramUnreachableError();
    throw new Error("Telegram delivery failed");
  }
  return deliveredTo;
}
