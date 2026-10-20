import { isTelegramDeliveryConfigured } from "../services/telegram";

/**
 * Публичные признаки настроенных интеграций (без секретов). Формы брони и
 * партнёрства показывают обязательное согласие на передачу через Telegram
 * только когда доставка действительно включена; тем же условием
 * руководствуется серверная валидация — расхождение исключено.
 */
export default defineEventHandler(() => ({
  telegramNotify: isTelegramDeliveryConfigured(),
}));
