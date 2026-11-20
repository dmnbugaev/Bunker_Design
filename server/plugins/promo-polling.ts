import {
  fetchPromoUpdates,
  handlePromoUpdateOnce,
  promoPollBackoffMs,
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
            /**
             * 409 «Conflict» выдаётся ЛЮБОМУ конкурентному getUpdates —
             * включая разовый диагностический curl или параллельно поднятый
             * dev-сервер. Реального вебхука здесь быть не может (входящие
             * от Telegram до REG.RU не доходят), поэтому навсегда выходить
             * по серии 409 нельзя: так конкурент — случайно поднятый dev —
             * убивал прод-поллинг на дни (падения 01.11 и 20.11). Теперь
             * конфликт только пережидается с растущим интервалом
             * (promoPollBackoffMs, потолок 10 минут) — поллинг
             * самовосстанавливается, как только конкурент исчезает.
             */
            conflicts += 1;
            const delay = promoPollBackoffMs(conflicts);
            console.warn(
              `Promo bot polling conflict (409), серия ${conflicts} — пауза ${Math.round(delay / 1000)} с, пережидаем конкурента.`,
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
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
