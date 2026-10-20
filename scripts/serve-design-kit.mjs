// Локальный статический сервер демо дизайн-кита (design-kit/).
// Демо живёт вне public/ и не деплоится на Vercel (см. .vercelignore);
// этот скрипт — единственный способ посмотреть его: npm run design-kit.
// Модули ES по file:// блокируются CORS, поэтому нужен http.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../design-kit", import.meta.url));
const port = Number(process.env.PORT) || 4173;
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
};

createServer(async (req, res) => {
  // Нормализация пути отсекает ../-эскейпы за пределы дизайн-кита.
  const url = new URL(req.url ?? "/", "http://localhost");
  const rel = normalize(decodeURIComponent(url.pathname)).replace(
    /^([/.])+/,
    "",
  );
  let file = join(root, rel === "" ? "demo/index.html" : rel);
  if (rel.endsWith("/")) file = join(file, "index.html");
  try {
    const body = await readFile(file);
    res.writeHead(200, {
      "Content-Type": types[extname(file)] ?? "application/octet-stream",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Демо дизайн-кита: http://127.0.0.1:${port}/demo/`);
});
