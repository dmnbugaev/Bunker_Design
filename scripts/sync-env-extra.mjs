#!/usr/bin/env node
/**
 * Копирует /home/admin/.bunker-env.extra → ./.env.extra при деплое на прод.
 *
 * Прод-`.env` (systemd EnvironmentFile) принадлежит пользователю bunker и
 * недоступен без sudo; этот скрипт выполняется на шаге `npm ci` деплоя —
 * от пользователя bunker — и переносит секреты из места, куда их может
 * положить администратор сервера. Репозиторий секретов не содержит.
 * Локально и в CI файла-источника нет — скрипт молча завершается.
 */
import { copyFile, chmod, access } from "node:fs/promises";
import { constants } from "node:fs";

const SOURCE = "/home/admin/.bunker-env.extra";
const TARGET = new URL("../.env.extra", import.meta.url).pathname;

try {
  await access(SOURCE, constants.R_OK);
} catch {
  process.exit(0); // нет источника — не прод, выходим тихо
}

try {
  await copyFile(SOURCE, TARGET);
  await chmod(TARGET, 0o600);
  console.log("[sync-env-extra] скопирован");
} catch (error) {
  // Сборку деплоя падать не должно: сервис продолжит работать со старым
  // файлом (или без него) — это фиксируется на health-check.
  console.warn("[sync-env-extra] пропущен:", error?.message ?? error);
}
