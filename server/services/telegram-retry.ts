/**
 * Ретраи исходящих вызовов Telegram. С 20.11.2026 туннель к api.telegram.org
 * (prohook-telegram-relay через myserver) не блокируется целиком, а теряет
 * бо́льшую часть соединений — DPI магистрали к myserver пропускает лишь
 * ~1 запрос из 3. Разовая попытка почти обречена, поэтому сетевые сбои,
 * таймауты, 429 и 5xx повторяются с короткой растущей паузой;
 * детерминированные 4xx (невалидный токен, чужой chat_id, истёкший файл)
 * не повторяются.
 */
export class TelegramHttpError extends Error {
  constructor(
    readonly status: number,
    method: string,
  ) {
    super(`Telegram ${method} failed: HTTP ${status}`);
  }
}

export const TELEGRAM_RETRY_ATTEMPTS = 3;
export const TELEGRAM_RETRY_BASE_DELAY_MS = 2000;

function retryDelay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    // Ожидание повтора не должно удерживать процесс.
    timer.unref?.();
  });
}

/** Повторяет сетевые сбои и 429/5xx; 4xx отдаёт как есть. */
export async function withTelegramRetries<T>(
  attempt: () => Promise<T>,
  attempts: number = TELEGRAM_RETRY_ATTEMPTS,
  baseDelayMs: number = TELEGRAM_RETRY_BASE_DELAY_MS,
): Promise<T> {
  for (let n = 1; ; n += 1) {
    try {
      return await attempt();
    } catch (error) {
      const status = error instanceof TelegramHttpError ? error.status : 0;
      const retryable = status === 0 || status === 429 || status >= 500;
      if (!retryable || n >= attempts) throw error;
      await retryDelay(baseDelayMs * n);
    }
  }
}
