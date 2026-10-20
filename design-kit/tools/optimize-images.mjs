// Генерирует public/images/ из библиотеки референсов design-kit/referens/:
// отбирает только используемые сайтом изображения и пережимает их в WebP
// (фото — до 1600px, дымы — с сохранением прозрачности). Хэш-имена исходников
// заменяются осмысленными слагами; соответствие зафиксировано в карте ниже.
//
// Запуск: node design-kit/tools/optimize-images.mjs
// (sharp уже в devDependencies; вне деплоя — папка исключена .vercelignore).
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const src = (name) => path.join(root, "design-kit", "referens", name);
const out = path.join(root, "public", "images");

// Фото: [исходник, слаг]. 1600px хватает витрине и hero (дальше —
// retina-перебор ради фикстурных снимков).
const photos = [
  [
    "pfzFwYWQRYIdNIHkIK6mIRl2DpooiwxYwIsJEOIhQZXFgosfPCQ7ZfpDM04TLDUkAIejcuUBvTt03lsxqVKy7kqQ.jpg",
    "hero",
  ],
  [
    "izXs90gk5s97wMyS_xLFyCzYMEgZLmTxaKG05MC0K--_VA3i7UahgS4pQSRzBccoQo8RIqzFvhZvUq2B1QKPpLji.jpg",
    "storefront",
  ],
  // Девять снимков фикстурного каталога (scripts/make-fixture-catalog.mjs,
  // карта IMG): слаги совпадают с ключами карты.
  [
    "bj8RTwsd6fvYS6l7uVJkVX0eRwSpdJELH_FGHCsoJ_S27TfkwuHfMAW3ks0bzJKFKstTGx7ks7dYIE1fWEGom9E6cNgJpA.jpg",
    "fx-vmate",
  ],
  [
    "UJrm6iFVuUF8GTYgTCi9JEKDy9bDj7i5-7aKHK-WytBeJKduGsnlfoNlIfep8qdWsBtCbMEpjq7aIpjy3lVQtIkQUKL0dA.jpg",
    "fx-mook",
  ],
  [
    "M4Jp7OjTwAmEAwPAaSvjzQbIIaP-YXUz4s8DlZ4uaqQQOxaSb5mZBJ3uIYcepPVamAWAtLvzlOepQejcapQQjSCz.jpg",
    "fx-kaos",
  ],
  [
    "_KY_sRns6H3lJ2nzvPlQ73i2z-f3n7mg11Ggd9kAleT2NaWRmiLzBdKFeRAc3J6rxsHyksvCCRc18x3xbeReSQYI.jpg",
    "fx-pod",
  ],
  [
    "0_tzCLV4Z08ZFwYH_txpFFuvyu6uM_FBeudDGE1FOk_tebn5jPr5KBxzvml5jek-RWu-VYMzqX7WeyEBbJLvpYyTJVxbpw.jpg",
    "fx-stels",
  ],
  [
    "V-R5cB34rXOs-N1mHgDAY6GfWnXgXToa9Gbyjrvt25tHrKYI7rNJANwShNNY1P3g7b77gg32nT0hZ7A8sm_ZllzeCeQINg.jpg",
    "fx-arqa",
  ],
  [
    "n3VVPkKv9pmDyE-dbvgWVxJNgchEUJFvhTxdCSRu09qHfVLRBc1BjsNuORzvx9IojsJaA97wx41XWL8sUGxhAgIL.jpg",
    "fx-liquid-1",
  ],
  [
    "su3QYdviRX4pXeHdbg85QrfaPq5QhLuDx_6dNBKDNVPtaXAgPTqAgAJwFn3Qrn_IxQd0NLk0H8qEwjkLXzjR-6fi.jpg",
    "fx-liquid-2",
  ],
  [
    "gjq65pQuEH7UkgeDtDHTTHRdx1tGQkxANfS6RPFwLUN3V41Pc7krgw8ukQQYTUJixvTWielNHRErZgzw44PJOTYTF15kzg.jpg",
    "fx-tea",
  ],
];

// Дымы: декоративные фоны (pages.css, mix-blend-mode: screen) — важна
// прозрачность, разрешение оставляем исходным ради мягких краёв.
const smokes = [
  ["дымы/pngwing.com-10.png", "smoke-hero"],
  ["дымы/pngwing.com-2.png", "smoke-hero-2"],
  ["дымы/pngwing.com-9.png", "smoke-bonus"],
];

await mkdir(out, { recursive: true });
let total = 0;
for (const [file, slug] of photos) {
  const target = path.join(out, `${slug}.webp`);
  const info = await sharp(src(file))
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(target);
  total += info.size;
  console.log(`${slug}.webp  ${Math.round(info.size / 1024)} KB`);
}
for (const [file, slug] of smokes) {
  const target = path.join(out, `${slug}.webp`);
  const info = await sharp(src(file)).webp({ quality: 85 }).toFile(target);
  total += info.size;
  console.log(`${slug}.webp  ${Math.round(info.size / 1024)} KB`);
}
console.log(`Итого: ${Math.round(total / 1024) / 1024} MB`);
