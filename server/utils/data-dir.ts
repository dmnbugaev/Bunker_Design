import { resolve } from "node:path";

/**
 * Абсолютный путь каталога файлового хранилища (по умолчанию .data/<name>,
 * вне Git). Явная переменная окружения (ACCOUNT_DATA_DIR и т.п.) всегда
 * приоритетна — ею тесты и продакшен направляют данные на постоянный том.
 *
 * На serverless-хостингах (Vercel: process.env.VERCEL) корень проекта
 * доступен только для чтения — каталог по умолчанию переносится в
 * перезаписываемый /tmp. Данные там живут до холодного старта функции:
 * для боевого продакшена с постоянством используйте VPS-деплой или
 * внешний стор (см. README, «Деплой»).
 */
export function resolveDataDir(envName: string, name: string): string {
  const configured = process.env[envName];
  if (configured) return resolve(process.cwd(), configured);
  if (process.env.VERCEL) return resolve("/tmp", "bunker", name);
  return resolve(process.cwd(), ".data", name);
}
