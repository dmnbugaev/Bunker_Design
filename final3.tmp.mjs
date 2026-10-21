import { chromium } from "@playwright/test";
const PORT = await (async () => { for (const p of [3000, 3001, 3002]) { try { const r = await fetch(`http://127.0.0.1:${p}/about`); if (r.ok && (await r.text()).includes("about-hero")) return p; } catch {} } throw new Error("no bunker server"); })();
console.log("port", PORT);
const browser = await chromium.launch();
const results = [];
const check = (n, p, d = "") => results.push(`${p ? "PASS" : "FAIL"} ${n}${d ? " — " + d : ""}`);
const ck = [{ name: "bunker-consent", value: '{"v":1,"analytics":false,"ts":1}', domain: "127.0.0.1", path: "/", expires: 2000000000, httpOnly: false, secure: false, sameSite: "Lax" }];
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, cookies: ck });
const page = await ctx.newPage();
await page.goto(`http://127.0.0.1:${PORT}/about`, { waitUntil: "networkidle" });
const b = page.locator(".cookie-consent");
if (await b.isVisible().catch(() => false)) await b.getByRole("button").first().click().catch(() => {});
await page.waitForTimeout(2600);
const p = await page.evaluate(() => ({
  crumbs: !!document.querySelector(".about-hero__crumbs, .breadcrumbs"),
  edition: !!document.querySelector(".edition"),
  mark: !!document.querySelector(".about-hero__mark"),
  core: !!document.querySelector(".about-hero__ring-core"),
  letters: document.querySelectorAll(".about-hero__letter").length,
  megaAnim: getComputedStyle(document.querySelector(".about-hero__mega")).animationName,
  megaOp: getComputedStyle(document.querySelector(".about-hero__mega")).opacity,
  subAnim: getComputedStyle(document.querySelector(".about-hero__sub")).animationName,
  ringAnim: getComputedStyle(document.querySelector(".about-hero__ring")).animationName,
  ringOp: getComputedStyle(document.querySelector(".about-hero__ring")).opacity,
  ringWords: !!document.querySelector(".about-hero__ring-words"),
  h1h: document.querySelector("h1")?.getBoundingClientRect().height,
  h1Text: document.querySelector("h1")?.innerText?.replace(/\s+/g, " "),
  sw: document.documentElement.scrollWidth,
  crumbsVisibleText: document.body.innerText.includes("ГЛАВНАЯ"),
  netText: document.body.innerText.includes("СЕТЬ ВЕЙПШОПОВ"),
}));
check("крошек нет", !p.crumbs && !p.crumbsVisibleText, JSON.stringify({el: p.crumbs, txt: p.crumbsVisibleText}));
check("бейджа нет", !p.edition && !p.netText, JSON.stringify({el: p.edition, txt: p.netText}));
check("слеша-плашки нет", !p.mark);
check("«Б» в кольце нет", !p.core);
check("кольцо текста на месте", p.ringWords);
check("6 букв", p.letters === 6, String(p.letters));
check("слово статично", p.megaAnim === "none" && p.megaOp === "1", `${p.megaAnim}/${p.megaOp}`);
check("подзаголовок hero-copy-in", p.subAnim === "hero-copy-in", String(p.subAnim));
check("кольцо hero-visual-in", p.ringAnim === "hero-visual-in" && p.ringOp === "1", `${p.ringAnim}/${p.ringOp}`);
check("h1 видим", (p.h1h ?? 0) > 100, String(p.h1h));
check("h1 текст", (p.h1Text ?? "").includes("БУНКЕР") && (p.h1Text ?? "").includes("Больше"), JSON.stringify(p.h1Text));
check("нет гор. скролла", p.sw <= 1440, String(p.sw));
await page.locator(".about-hero").screenshot({ path: "/tmp/about-hero-shots/desktop-hero.png" });
await page.screenshot({ path: "/tmp/about-hero-shots/desktop-full.png", fullPage: true });
await ctx.close();
{
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, cookies: ck });
  const mp = await m.newPage();
  await mp.goto(`http://127.0.0.1:${PORT}/about`, { waitUntil: "networkidle" });
  const mb = mp.locator(".cookie-consent");
  if (await mb.isVisible().catch(() => false)) await mb.getByRole("button").first().click().catch(() => {});
  await mp.waitForTimeout(2600);
  const r = await mp.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    letters: [...document.querySelectorAll(".about-hero__letter")].map((l) => l.getBoundingClientRect()),
  }));
  const gaps = r.letters.slice(1).map((b2, i) => Math.round(b2.left - r.letters[i].right));
  check("моб: нет скролла, зазоры ≥ 20", r.sw <= 390 && gaps.every((g) => g >= 20), `${r.sw} ${JSON.stringify(gaps)}`);
  await mp.locator(".about-hero").screenshot({ path: "/tmp/about-hero-shots/mobile-hero.png" });
  await m.close();
}
await browser.close();
console.log(results.join("\n"));
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
