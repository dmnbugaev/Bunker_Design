// Генератор фирменного фавикона «Бункера» (v3, с нуля).
//
// Иконка = сама плита. Силуэт — фирменная коралловая трапеция знака
// из шапки (.brand-mark, clip-path 0 0 / 100% 0 / 74% 100% / 0 100%,
// пропорции 26×28), почти во весь кадр. Литера «Б» вырезана насквозь:
// негативное пространство подстраивается под фон вкладки (на светлом
// фоне буква светлая, на тёмном — тёмная). Один объект, без глоу и
// контейнеров. Для apple-touch вырез заполнен тёмным (iOS не любит
// прозрачность). BICUBIK в репозитории/системе нет — литера построена
// геометрически: строгая прямоугольная сетка, тяжёлый дисплейный
// штрих, широкый просвет, одна фаска 45° у чаши.
//
// Запуск: node design-kit/tools/generate-favicon.mjs [variant]
//   variant: cut | dark (по умолчанию cut — сквозной вырез;
//   dark — буква всегда тёмная #171717). Флаг --compare — лист
//   сравнения с превью 32/16 px на светлом и тёмном фоне в /tmp.
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const outDir = join(root, "public", "brand");

// ── Плита: отступ 32, высота 448, ширина 448·(26/28)≈416 ──────────────
const PLATE_H = 448;
const PLATE_W = 416;
const PLATE_L = 48;
const PLATE_TOP = 32;
const PLATE_BR_X = PLATE_L + PLATE_W * 0.74; // 355.8 — срез 74%
const PLATE = `${PLATE_L},${PLATE_TOP} ${PLATE_L + PLATE_W},${PLATE_TOP} ${PLATE_BR_X.toFixed(1)},${PLATE_TOP + PLATE_H} ${PLATE_L},${PLATE_TOP + PLATE_H}`;

// ── Литера «Б»: сетка 260×320, штрих 54, фаска 45° у чаши ─────────────
const GLYPH_OUTER =
  "M0,0 L260,0 L260,54 L54,54 L54,98 L260,98 L260,266 L224,320 L0,320 Z";
const GLYPH_COUNTER = "M54,152 L206,152 L206,266 L54,266 Z";

// Литера в кадре: x 80..340, y 96..416 — прижата влево, как вордмарк
// рядом со знаком; просвет чаши ≈3.6 px при рендере 16 px.
const LETTER_TRANSFORM = "translate(80,96)";

// Вырез делается маской: плита минус литера. Для квадратных рендеров
// (apple/mark) под маской тёмная подложка — буква получается тёмной
// без перерисовки; вариант dark красит литеру поверх на прозрачном
// холсте (буква всегда тёмная, даже на светлом фоне).
const faviconSvg = (variant, { square = false } = {}) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="plate" x1="0" y1="0" x2="0.25" y2="1">
      <stop offset="0" stop-color="#ff7474"/>
      <stop offset="1" stop-color="#e94747"/>
    </linearGradient>
    <mask id="cut">
      <rect width="512" height="512" fill="white"/>
      <g transform="${LETTER_TRANSFORM}">
        <path d="${GLYPH_OUTER} ${GLYPH_COUNTER}" fill="black" fill-rule="evenodd"/>
      </g>
    </mask>
  </defs>
  ${square ? '<rect width="512" height="512" fill="#171717"/>' : ""}
  <polygon points="${PLATE}" fill="url(#plate)" mask="url(#cut)"/>
  ${
    variant === "dark"
      ? `<g transform="${LETTER_TRANSFORM}" fill="#171717" fill-rule="evenodd">
      <path d="${GLYPH_OUTER} ${GLYPH_COUNTER}"/>
    </g>`
      : ""
  }
</svg>`;

const render = (svg, size) =>
  sharp(Buffer.from(svg)).resize(size, size, { kernel: "lanczos3" }).png();

// Превью иконки size×size на цветной подложке (имитация фона вкладки),
// увеличенное nearest-ом, чтобы видеть реальные пиксели.
const chipOn = async (svg, size, bg, upscale) => {
  const pad = Math.round(size * 0.5);
  const icon = await render(svg, size).toBuffer();
  const base = await sharp({
    create: {
      width: size + pad * 2,
      height: size + pad * 2,
      channels: 4,
      background: bg,
    },
  })
    .composite([{ input: icon, left: pad, top: pad }])
    .png()
    .toBuffer();
  return sharp(base)
    .resize((size + pad * 2) * upscale, (size + pad * 2) * upscale, {
      kernel: "nearest",
    })
    .png()
    .toBuffer();
};

if (process.argv.includes("--compare")) {
  const tmp = "/tmp/bunker-favicon-compare";
  await mkdir(tmp, { recursive: true });
  const cell = 560;
  const halves = [];
  for (const v of ["cut", "dark"]) {
    const big = await render(faviconSvg(v), 512).toBuffer();
    const c32w = await chipOn(faviconSvg(v), 32, "#ffffff", 6);
    const c32d = await chipOn(faviconSvg(v), 32, "#2a2a2a", 6);
    const c16w = await chipOn(faviconSvg(v), 16, "#ffffff", 8);
    const c16d = await chipOn(faviconSvg(v), 16, "#2a2a2a", 8);
    halves.push(
      await sharp({
        create: {
          width: cell,
          height: cell * 2,
          channels: 4,
          background: { r: 42, g: 42, b: 42, alpha: 1 },
        },
      })
        .composite([
          { input: big, left: 24, top: 24 },
          { input: c32w, left: 24, top: 568 },
          { input: c32d, left: 300, top: 568 },
          { input: c16w, left: 24, top: 830 },
          { input: c16d, left: 300, top: 830 },
        ])
        .png()
        .toBuffer(),
    );
  }
  await sharp({
    create: {
      width: cell * 2,
      height: cell * 2,
      channels: 4,
      background: { r: 42, g: 42, b: 42, alpha: 1 },
    },
  })
    .composite([
      { input: halves[0], left: 0, top: 0 },
      { input: halves[1], left: cell, top: 0 },
    ])
    .png()
    .toFile(join(tmp, "compare.png"));
  console.log("Лист сравнения:", join(tmp, "compare.png"));
  process.exit(0);
}

const variant = process.argv[2] ?? "cut";
const targets = [
  { name: "favicon.svg", svg: faviconSvg(variant), write: true },
  { name: "favicon.png", svg: faviconSvg(variant), size: 256 },
  { name: "favicon-32.png", svg: faviconSvg(variant), size: 32 },
  // Apple сам скругляет углы маской: квадрат на весь холст с тёмной
  // подложкой — прозрачность iOS залила бы чёрным неравномерно.
  {
    name: "apple-touch-icon.png",
    svg: faviconSvg(variant, { square: true }),
    size: 180,
  },
  // Фирменная марка 512 — для og/пресс-материалов.
  {
    name: "mark.png",
    svg: faviconSvg(variant, { square: true }),
    size: 512,
  },
];

await mkdir(outDir, { recursive: true });
for (const t of targets) {
  const out = join(outDir, t.name);
  if (t.write) {
    const pretty =
      t.svg
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .join("\n") + "\n";
    await writeFile(out, pretty, "utf8");
  } else {
    await render(t.svg, t.size).toFile(out);
  }
  console.log("✓", t.name);
}
console.log("Готово:", outDir, `(${variant})`);
