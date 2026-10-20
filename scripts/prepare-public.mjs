// Копирует статические ассеты дизайн-системы и референсные изображения в public/,
// чтобы демо дизайн-системы работало на /design-system/, а фикстурный каталог
// Бункера имел реальные изображения. Запускается из postinstall, но безопасен
// и при отсутствии исходников (сборка приложения от него не зависит).
import { cp, mkdir, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function copy(from, to) {
  if (!(await exists(from))) return;
  await mkdir(path.dirname(to), { recursive: true });
  await cp(from, to, { recursive: true });
}

// Демо дизайн-системы: страница + её стили и скрипты (абсолютные пути /assets/...).
await copy(
  path.join(root, "design-system"),
  path.join(root, "public", "design-system"),
);
await copy(
  path.join(root, "assets", "styles"),
  path.join(root, "public", "assets", "styles"),
);
await copy(
  path.join(root, "assets", "js"),
  path.join(root, "public", "assets", "js"),
);

// Референсы: изображения для демо, фикстурного каталога и брендовых секций.
await copy(path.join(root, "referens"), path.join(root, "public", "referens"));

// Папка шрифтов (woff2 кладутся вручную, см. docs/NEEDS-DATA.md).
await copy(
  path.join(root, "assets", "fonts"),
  path.join(root, "public", "fonts"),
);
