import { expect, test, type Page } from "@playwright/test";

interface MetaStore {
  id: string;
  cityId: string;
  name: string;
  address?: string;
  hours?: string;
  coordinates?: [number, number];
}
interface MetaCity {
  id: string;
  name: string;
}

// Ожидания выводятся из меты каталога (фикстура или живой «МойСклад»):
// конкретные адреса сети принадлежат данным владельца, а не тестам.
let stores: MetaStore[] = [];
let cities: MetaCity[] = [];
test.beforeAll(async ({ request }) => {
  const meta = (await (await request.get("/api/catalog/meta")).json()) as {
    stores: MetaStore[];
    cities: MetaCity[];
  };
  stores = meta.stores;
  cities = meta.cities;
});

const pinned = () => stores.filter((store) => store.coordinates);
const addressed = () => stores.filter((store) => store.address);
const cityLabel = (cityId: string) =>
  cities.find((city) => city.id === cityId)?.name ?? cityId;

async function openContacts(page: Page) {
  await page.goto("/contacts");
  // Ждём гидрации: до неё клики по списку не обрабатываются Vue.
  await page.waitForFunction(
    () =>
      (
        document.querySelector("#__nuxt") as Element & {
          __vue_app__?: { $nuxt?: { isHydrating: boolean } };
        }
      )?.__vue_app__?.$nuxt?.isHydrating === false,
  );
  // Карта инициализируется лениво при приближении к вьюпорту —
  // подкатываем её, чтобы зависимые от карты проверки не зависели
  // от высоты вьюпорта.
  await page.locator(".stores-map-frame").scrollIntoViewIfNeeded();
}

test.describe("Контакты: блок «Наши магазины»", () => {
  test(`на странице все магазины сети (${stores.length} в фикстуре), сгруппированные по городам`, async ({
    page,
  }) => {
    test.skip(stores.length === 0, "в мете нет магазинов");
    await openContacts(page);
    await expect(
      page.getByRole("heading", { name: "Наши магазины" }),
    ).toBeVisible();
    await expect(page.locator(".store-map-option")).toHaveCount(stores.length);
    for (const city of cities) {
      const expected = stores.filter(
        (store) => store.cityId === city.id,
      ).length;
      if (expected === 0) continue;
      await expect(
        page.getByRole("heading", { name: city.name }),
      ).toBeVisible();
    }
  });

  test("адреса доступны в DOM без карты (SEO и доступность)", async ({
    page,
  }) => {
    test.skip(addressed().length === 0, "в мете нет адресов");
    await openContacts(page);
    const list = page.locator(".stores-map-list");
    for (const store of addressed()) {
      await expect(list).toContainText(store.address!);
      await expect(list).toContainText(cityLabel(store.cityId));
    }
  });

  test("карта инициализируется и показывает маркеры", async ({ page }) => {
    test.skip(pinned().length === 0, "ни у одного магазина нет координат");
    await openContacts(page);
    // SDK Яндекс.Карт грузится с сети — даём больше времени на первый пуск.
    await expect(
      page.locator(".stores-map-view .store-pin").first(),
    ).toBeVisible({ timeout: 20000 });
    await expect(page.locator(".store-pin")).toHaveCount(pinned().length);
  });

  test("выбор магазина в списке: подсветка, попап, выделение маркера", async ({
    page,
  }) => {
    const target = pinned()[0];
    test.skip(!target, "ни у одного магазина нет координат");
    await openContacts(page);
    const option = page
      .locator(".store-map-option")
      .filter({ hasText: target.address ?? target.name });
    await option.click();
    await expect(option).toHaveClass(/store-map-option--selected/);
    await expect(option).toHaveAttribute("aria-pressed", "true");
    // Первый запрос к карте ждёт инициализации SDK — под нагрузкой полного
    // прогона это дольше дефолных 5 секунд.
    await expect(page.locator(".store-pin--selected")).toHaveCount(1, {
      timeout: 20000,
    });

    const popup = page.locator(".store-popup-card");
    await expect(popup).toBeVisible();
    await expect(popup).toContainText(
      `${cityLabel(target.cityId)}, ${target.address}`,
    );
    await expect(popup).toContainText("Режим:");
  });

  test("клик по маркеру выделяет магазин в списке", async ({ page }) => {
    const target = pinned().find((store) => store.address);
    test.skip(!target, "нет магазина с координатами и адресом");
    await openContacts(page);
    await expect(page.locator(".store-pin")).toHaveCount(pinned().length, {
      timeout: 20000,
    });
    await page
      .locator(".store-map-option")
      .filter({ hasText: target!.address! })
      .click();
    await expect(page.locator(".store-pin--selected")).toHaveCount(1);
    // Кликать нужно по координатам штырька: над маркерами у Яндекса лежит
    // прозрачный events-pane, который ловит клики и передаёт их маркеру.
    const pin = page.locator(`.store-pin-anchor[title*="${target!.name}"]`);
    await pin.scrollIntoViewIfNeeded();
    const box = await pin.boundingBox();
    if (!box) {
      throw new Error(`Маркер ${target!.name} не найден на карте`);
    }
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    const selected = page.locator(".store-map-option--selected");
    await expect(selected).toHaveCount(1);
    await expect(selected).toContainText(target!.address!);
    await expect(page.locator(".store-popup-card")).toBeVisible();
    await expect(page.locator(".store-popup-card")).toContainText(
      target!.address!,
    );
  });

  test("повторный клик по выбранному магазину снимает выбор", async ({
    page,
  }) => {
    const target = pinned()[0];
    test.skip(!target, "ни у одного магазина нет координат");
    await openContacts(page);
    const option = page
      .locator(".store-map-option")
      .filter({ hasText: target.address ?? target.name });
    await option.click();
    await expect(page.locator(".store-pin--selected")).toHaveCount(1);
    await option.click();
    await expect(option).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator(".store-pin--selected")).toHaveCount(0);
    await expect(page.locator(".store-popup-card")).toHaveCount(0);
  });
});
