import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Дополнительный env-файл (.env.extra в корне сайта): заполняется при
 * деплое (scripts/sync-env-extra.mjs копирует его из /home/admin), потому
 * что прод-`.env` принадлежит пользователю bunker и недоступен для записи
 * без sudo. Значения применяются только те, которых ещё нет в окружении
 * (семантика dotenv), поэтому локальная разработка и e2e не затрагиваются.
 * Вызывается на импорте из promo-telegram — до первого чтения TELEGRAM_*.
 */
const EXTRA_ENV_FILE = resolve(process.cwd(), ".env.extra");
let loaded = false;

export function loadExtraEnv(): void {
  if (loaded) return;
  loaded = true;
  if (process.env.BUNKER_SKIP_EXTRA_ENV === "1") return;
  try {
    if (!existsSync(EXTRA_ENV_FILE)) return;
    const lines = readFileSync(EXTRA_ENV_FILE, "utf8").split("\n");
    for (const line of lines) {
      const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line.trim());
      if (!match) continue;
      const key = match[1] as string;
      const value = match[2] ?? "";
      if (process.env[key] === undefined)
        process.env[key] = value.replace(/^["']|["']$/g, "");
    }
  } catch (error) {
    console.error(
      "Extra env file failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}

/** Только для тестов: сброс флага идемпотентности. */
export function resetExtraEnvForTests(): void {
  loaded = false;
}
