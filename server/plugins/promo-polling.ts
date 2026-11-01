import {
  fetchPromoUpdates,
  handlePromoUpdateOnce,
} from "../services/promo-telegram";
import { telegramSilenced } from "../utils/telegram-silence";

/**
 * Поллинг бота промо-акций: getUpdates long poll. Включается только явно —
 * TELEGRAM_PROMO_POLLING=1. Это ОСНОВНОЙ канал на проде: исходящие к
 * api.telegram.org идут через SSH-туннель с myserver (юнит
 * prohook-telegram-relay), а входящие вебхуки до REG.RU не доходят —
 * магистраль дропает подсети Telegram. Локально для dev — тот же флаг,
 * но на время локального поллинга прод-поллинг останавливают (иначе два
 * getUpdates конфликтуют 409). В e2e-режиме (MOYSKLAD_SNAPSHOT_PATH) и без
 * токена поллинг не стартует — тесты молчат.
 */

const POLL_DELAY_MS = 3000;
const RETRY_DELAY_MS = 5000;
/**
 * 409 «Conflict» выдаётся не только вебхуку, но и ЛЮБОМУ конкурентному
 * getUpdates — включая разовый диагностический curl или параллельно
 * поднятый dev-сервер: они живут секунды, а поллинг раньше навсегда
 * выходил по первому 409 (наблюдавшееся падение прода 01.11). Теперь
 * конфликт пережидается с растущим интервалом; выйти «навсегда» можно
 * только по устойчивой серии — признаки реально включённого вебхука.
 */
const MAX_CONSECUTIVE_409 = 6;

export default defineNitroPlugin(() => {
  if (process.env.TELEGRAM_PROMO_POLLING !== "1") return;
  if (!process.env.TELEGRAM_PROMO_BOT_TOKEN?.trim()) return;
  if (process.env.MOYSKLAD_SNAPSHOT_PATH) return;
  // Тестовое окружение: бот акций тоже молчит (мандат владельца 20.10).
  if (telegramSilenced()) return;

  const timer = setTimeout(() => {
    void (async () => {
      let offset = 0;
      let conflicts = 0;
      for (;;) {
        try {
          const updates = await fetchPromoUpdates(offset);
          conflicts = 0;
          for (const update of updates) {
            offset = update.update_id + 1;
            await handlePromoUpdateOnce(update);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "";
          if (message.includes("409")) {
            conflicts += 1;
            if (conflicts >= MAX_CONSECUTIVE_409) {
              console.error(
                "Promo bot polling stopped: webhook is active (409 series).",
              );
              return;
            }
            console.warn(
              `Promo bot polling conflict (409), попытка ${conflicts}/${MAX_CONSECUTIVE_409} — пережидаем конкурента.`,
            );
            await new Promise((resolve) =>
              setTimeout(resolve, RETRY_DELAY_MS * conflicts),
            );
            continue;
          }
          console.error(
            "Promo bot polling failed:",
            message || "Unknown error",
          );
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }
      }
    })();
  }, POLL_DELAY_MS);
  timer.unref?.();
});
