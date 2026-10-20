import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";
import {
  ARTIFACTS,
  AUDIT_PAGES,
  collectTouchTargets,
  ensureDir,
  openPage,
} from "./helpers";

// Аудит touch-targets на мобильных ширинах, двухуровневая модель:
//  - полноценные контролы (кнопки, иконки, поля, пагинация, чекбоксы) —
//    ≥ 44×44 (Apple HIG);
//  - прочие цели (текстовые ссылки в потоке, пункты подвала) — ≥ 24×24
//    (WCAG 2.5.8 AA; исключение «inline в потоке» уже учтено в сборщике).
// Сторонний DOM виджета Яндекс.Карт не проверяем.
const MOBILE_WIDTHS = [320, 375, 390, 430];

const CONTROL = /^(button|input|select|textarea|summary)$/i;
const CONTROL_CLASSES = new Set([
  "icon-button",
  "pagination",
  "product-card__select",
  "choice",
  "switch",
]);
function isControl(t: { tag: string; cls: string; name: string }) {
  const hasControlClass = t.cls
    .split(/\s+/)
    .some((c) => CONTROL_CLASSES.has(c));
  if (t.tag === "a" && !hasControlClass) return false;
  return CONTROL.test(t.tag) || hasControlClass;
}

test.describe("touch target audit", () => {
  ensureDir(`${ARTIFACTS}/reports`);

  test("interactive elements meet 44x44 minimum", async ({
    page,
  }, testInfo) => {
    if (testInfo.project.name !== "audit-chromium") return;
    const small: unknown[] = [];
    const all: unknown[] = [];
    for (const def of AUDIT_PAGES) {
      for (const width of MOBILE_WIDTHS) {
        await page.setViewportSize({ width, height: 800 });
        await openPage(page, def.path);
        const targets = await collectTouchTargets(page);
        for (const t of targets) {
          all.push({ page: def.name, width, ...t });
          // ymaps-* — внутренности виджета Яндекс.Карт (сторонний DOM).
          if (/ymaps/.test(t.cls)) continue;
          const min = isControl(t) ? 44 : 24;
          if (t.w < min || t.h < min)
            small.push({ page: def.name, width, ...t });
        }
      }
    }
    writeFileSync(
      `${ARTIFACTS}/reports/touch-targets.json`,
      JSON.stringify({ small, total: all.length }, null, 2),
    );
    // Уникальные нарушители (одна и та же кнопка на 4 ширинах = 1 запись)
    const label = (s: {
      page: string;
      tag: string;
      cls: string;
      name: string;
      w: number;
      h: number;
    }) => `${s.page}: ${s.tag}.${s.cls} "${s.name}" (${s.w}×${s.h})`;
    const unique = [...new Set(small.map(label))];
    expect(
      unique,
      `targets under 44x44 (controls) / 24x24 (links), ${small.length} occurrences, details: touch-targets.json`,
    ).toEqual([]);
  });
});
