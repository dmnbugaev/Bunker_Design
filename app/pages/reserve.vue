<script setup lang="ts">
import {
  availabilityLabels,
  formatPrice,
  getOffer,
} from "~~/shared/utils/product";
import { validateReservation } from "~~/shared/utils/reservation";
import { formatPhone, fullName } from "~~/shared/utils/account";
import { bunkerContacts } from "~~/shared/content/bunker";
import type { ProductList } from "~~/shared/types/catalog";
import type { Product } from "~~/shared/types/product";

/**
 * Список выбранных товаров и форма запроса на резерв. Страница не продаёт:
 * отправка формы — это запрос магазику, а не покупка; оплата и передача
 * товара происходятся только в самом магазине после проверки возраста.
 */
usePageSeo(
  "Список выбранных товаров",
  "Сформируйте список товаров Бункер, выберите магазин и отправьте запрос на резерв: покупка — только в магазине после проверки возраста.",
);
const { store, city, pickerOpen } = useStoreSelection();
const { entries, count, totalQuantity, setQuantity, remove, clear } =
  useSelectionList();
const { user } = useSessionUser();
await useCatalogMeta();

// "__empty__" не существует в каталоге: пустой список не тянет страницу
// каталога (ids без совпадений → пустая выборка).
const idsParam = computed(() =>
  entries.value.length > 0
    ? entries.value.map((entry) => entry.productId).join(",")
    : "__empty__",
);
const { data: list } = await useFetch<ProductList>("/api/products", {
  query: computed(() => ({ ids: idsParam.value, limit: 24 })),
});

interface SelectionRow {
  productId: string;
  quantity: number;
  product: Product | undefined;
}
const rows = computed<SelectionRow[]>(() =>
  entries.value.map((entry) => ({
    productId: entry.productId,
    quantity: entry.quantity,
    product: list.value?.items.find((item) => item.id === entry.productId),
  })),
);
/** Позиции, которые заведомо нельзя запросить в выбранном магазине. */
function rowIssue(row: SelectionRow): string | null {
  if (!row.product)
    return "Товар больше не доступен на сайте — удалите его из списка.";
  if (!store.value) return null;
  const offer = getOffer(row.product, store.value.id);
  if (!offer) return "Не представлен в выбранном магазине.";
  if (offer.availability === "unavailable")
    return "Нет в наличии в выбранном магазине.";
  return null;
}
const blockingCount = computed(
  () => rows.value.filter((row) => rowIssue(row) !== null).length,
);
function rowPrice(row: SelectionRow): string | null {
  if (!row.product) return null;
  const offer = store.value ? getOffer(row.product, store.value.id) : undefined;
  const price =
    offer?.price ??
    (row.product.offers.length > 0
      ? Math.min(...row.product.offers.map((entry) => entry.price))
      : null);
  return price !== null ? formatPrice(price) : null;
}
function rowAvailability(row: SelectionRow): string {
  if (!row.product || !store.value) return "";
  const offer = getOffer(row.product, store.value.id);
  return offer ? availabilityLabels[offer.availability] : "";
}

const form = reactive({
  name: "",
  phone: "",
  comment: "",
  consent: false,
  consentTelegram: false,
  website: "",
});
const errors = ref<Record<string, string>>({});
const pending = ref(false);
const sent = ref(false);
const sentPublicId = ref("");
const failure = ref("");
const formElement = ref<HTMLFormElement>();
const successElement = ref<HTMLElement>();

// Авторизованным подставляем известные контакты (не блокируя правки).
watch(
  user,
  (value) => {
    if (!value) return;
    if (!form.name) form.name = fullName(value);
    if (!form.phone) form.phone = formatPhone(value.phone);
  },
  { immediate: true },
);

const { public: config } = useRuntimeConfig();
const captchaEnabled = Boolean(config.smartCaptchaClientKey);
// Согласие на передачу через Telegram — только при настроенной доставке;
// тот же признак использует серверная валидация, расхождения быть не может.
const { data: integrationFlags } = await useFetch<{
  telegramNotify: boolean;
}>("/api/integration-flags");
const telegramEnabled = integrationFlags.value?.telegramNotify === true;

// Бонусный баланс для справки у формы брони: начисление/списание выполняет
// касса магазина, сайт баллы дистанционно не списывает (модель ProHook).
interface ReserveLoyalty {
  status: "ok" | "unlinked" | "unavailable";
  balance?: number;
  message?: string;
  program?: {
    name: string;
    earnRateRoublesToPoint: number;
    spendRatePointsToRouble: number;
    maxPaidRatePercents: number;
  };
}
const loyalty = ref<ReserveLoyalty | null>(null);
watch(
  user,
  async (value) => {
    if (!value) {
      loyalty.value = null;
      return;
    }
    try {
      loyalty.value = await $fetch<ReserveLoyalty>("/api/account/loyalty", {
        retry: 0,
      });
    } catch {
      loyalty.value = { status: "unavailable" };
    }
  },
  { immediate: true },
);
const captchaToken = ref("");
const captchaReset = ref(0);
const idempotencyKey = ref("");
function newIdempotencyKey() {
  idempotencyKey.value =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
onMounted(newIdempotencyKey);

async function submit() {
  if (pending.value) return;
  failure.value = "";
  const validation = validateReservation(
    {
      ...form,
      storeId: store.value?.id ?? "",
      items: entries.value,
    },
    { requireTelegramConsent: telegramEnabled },
  );
  errors.value = { ...validation.errors };
  if (captchaEnabled && !captchaToken.value)
    errors.value.captcha = "Пройдите проверку «Я не робот».";
  if (!validation.valid || errors.value.captcha) {
    await nextTick();
    formElement.value
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
    return;
  }
  pending.value = true;
  try {
    const response = await $fetch("/api/reservations", {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey.value },
      body: {
        name: form.name,
        phone: form.phone,
        comment: form.comment,
        consent: form.consent,
        consentTelegram: form.consentTelegram,
        storeId: store.value?.id,
        items: entries.value,
        website: form.website,
        ...(captchaEnabled ? { captchaToken: captchaToken.value } : {}),
      },
      retry: 0,
    });
    sent.value = true;
    sentPublicId.value = response.publicId;
    clear();
    Object.assign(form, {
      name: "",
      phone: "",
      comment: "",
      consent: false,
      consentTelegram: false,
      website: "",
    });
    newIdempotencyKey();
    captchaToken.value = "";
    captchaReset.value += 1;
    await nextTick();
    successElement.value?.focus();
  } catch (error) {
    const response = error as {
      statusCode?: number;
      data?: { data?: { errors?: Record<string, string>; message?: string } };
    };
    if (response.statusCode === 422 && response.data?.data?.errors)
      errors.value = response.data.data.errors;
    failure.value =
      response.statusCode === 429
        ? "Слишком много запросов. Попробуйте через 15 минут или позвоните в магазин."
        : (response.data?.data?.message ??
          "Не удалось отправить запрос. Список и данные формы сохранены — попробуйте ещё раз.");
    // Токен капчи одноразовый даже при неудачной отправке.
    captchaToken.value = "";
    captchaReset.value += 1;
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <UiContainer class="page-shell reserve-page">
    <UiBreadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Список выбранных товаров' },
      ]"
    />
    <div class="page-heading">
      <p class="eyebrow">Бункер / Самовывоз</p>
      <h1>Список выбранных товаров</h1>
      <p>
        Проверьте состав списка, выберите магазин самовывоза и оставьте контакты
        — сотрудник магазина обработает запрос.
      </p>
    </div>

    <div
      v-if="sent"
      ref="successElement"
      class="reserve-success"
      tabindex="-1"
      role="status"
    >
      <span class="reserve-success__check" aria-hidden="true">✓</span>
      <h2>Запрос на резерв отправлен</h2>
      <p>
        Номер запроса: <strong>{{ sentPublicId }}</strong
        >. Покажите или назовите его сотруднику магазина.
      </p>
      <p>
        Сотрудник выбранного магазина получит список и свяжется с вами, если
        позициям потребуется уточнение. Запрос действует 24 часа. Это не
        покупка: приобретение, проверка возраста и оплата происходят только в
        магазине, онлайн-оплаты и доставки на сайте нет.
      </p>
      <div class="dialog__actions">
        <NuxtLink to="/catalog" class="button button--secondary"
          >Вернуться в каталог</NuxtLink
        >
        <NuxtLink to="/" class="button button--quiet">На главную</NuxtLink>
      </div>
    </div>

    <template v-else>
      <UiEmptyState v-if="count === 0" title="Список пуст" aria-live="polite">
        Выберите товары в каталоге — они появятся здесь, и вы сможете отправить
        запрос на резерв в удобный магазин.
        <template #action
          ><NuxtLink to="/catalog" class="button button--secondary"
            >Перейти в каталог</NuxtLink
          ></template
        >
      </UiEmptyState>

      <div v-else class="reserve-layout">
        <div class="reserve-main">
          <section aria-labelledby="reserve-items-title">
            <div class="reserve-section-heading">
              <h2 id="reserve-items-title">Товары</h2>
              <button type="button" class="text-link" @click="clear()">
                Очистить список
              </button>
            </div>
            <p class="caption" role="status">
              В списке позиций: {{ count }} · штук: {{ totalQuantity }}
            </p>
            <ul class="reserve-items">
              <li
                v-for="row in rows"
                :key="row.productId"
                class="reserve-item"
                :class="{ 'reserve-item--issue': rowIssue(row) }"
              >
                <ProductImage
                  class="reserve-item__visual"
                  :image="row.product?.images[0]"
                  :restricted="row.product?.imagesRestricted"
                />
                <div class="reserve-item__info">
                  <p class="caption">
                    {{ row.product?.categoryName ?? "Каталог" }}
                  </p>
                  <h3>
                    <NuxtLink :to="`/product/${row.productId}`">{{
                      row.product?.name ?? row.productId
                    }}</NuxtLink>
                  </h3>
                  <p v-if="rowAvailability(row)" class="caption">
                    {{ rowAvailability(row) }}
                  </p>
                  <p v-if="rowPrice(row)" class="reserve-item__price">
                    {{ rowPrice(row) }} / {{ row.product?.unit ?? "1 шт"
                    }}<span v-if="!store"> · минимальная цена</span>
                  </p>
                  <p v-if="rowIssue(row)" class="reserve-item__issue">
                    {{ rowIssue(row) }}
                  </p>
                </div>
                <div class="reserve-item__controls">
                  <div
                    class="quantity-stepper"
                    role="group"
                    aria-label="Количество"
                  >
                    <UiIconButton
                      label="Уменьшить количество"
                      :disabled="pending"
                      @click="setQuantity(row.productId, row.quantity - 1)"
                      >−</UiIconButton
                    >
                    <output>{{ row.quantity }}</output>
                    <UiIconButton
                      label="Увеличить количество"
                      :disabled="pending || row.quantity >= 10"
                      @click="setQuantity(row.productId, row.quantity + 1)"
                      >+</UiIconButton
                    >
                  </div>
                  <button
                    type="button"
                    class="text-link"
                    @click="remove(row.productId)"
                  >
                    Удалить
                  </button>
                </div>
              </li>
            </ul>
          </section>

          <section aria-labelledby="reserve-store-title">
            <div class="reserve-section-heading">
              <h2 id="reserve-store-title">Магазин самовывоза</h2>
            </div>
            <div v-if="store" class="reserve-store">
              <p>
                <strong>{{ store.name }}</strong>
              </p>
              <p class="caption">
                {{ city?.name
                }}<template v-if="store.address">
                  · {{ store.address }}</template
                >
              </p>
              <button
                type="button"
                class="text-link"
                @click="pickerOpen = true"
              >
                Изменить магазин
              </button>
            </div>
            <div v-else class="reserve-store reserve-store--empty">
              <p>Магазин не выбран.</p>
              <p class="caption">
                Наличие и цены зависят от конкретной точки самовывоза.
              </p>
              <UiButton @click="pickerOpen = true">Выбрать магазин</UiButton>
            </div>
          </section>

          <section aria-labelledby="reserve-form-title">
            <div class="reserve-section-heading">
              <h2 id="reserve-form-title">Запрос на резерв</h2>
            </div>
            <p class="reserve-legal-note">
              Отправляя форму, вы просите магазин отложить товары к вашему
              визиту. Это не покупка и не заказ с оплатой: сайт не принимает
              оплату и не доставляет товары. Продажа, проверка возраста и выдача
              товара происходят только в выбранном магазине; магазин вправе
              отказать в продаже в предусмотренных законом случаях.
            </p>
            <form
              ref="formElement"
              class="reserve-form"
              novalidate
              :aria-busy="pending"
              @submit.prevent="submit"
            >
              <p class="caption">Поля со звёздочкой обязательны.</p>
              <fieldset :disabled="pending" class="reserve-form__grid">
                <legend class="sr-only">Контакты</legend>
                <UiField
                  v-model="form.name"
                  label="Имя *"
                  name="name"
                  autocomplete="name"
                  placeholder="Иван"
                  required
                  maxlength="80"
                  :error="errors.name"
                />
                <UiField
                  v-model="form.phone"
                  label="Телефон *"
                  name="phone"
                  type="tel"
                  autocomplete="tel"
                  placeholder="+7 (999) 123-45-67"
                  required
                  maxlength="32"
                  :error="errors.phone"
                />
                <UiField
                  v-model="form.comment"
                  label="Комментарий (необязательно)"
                  name="comment"
                  multiline
                  placeholder="Например, удобное время визита"
                  maxlength="500"
                  :error="errors.comment"
                />
              </fieldset>
              <p v-if="errors.storeId" class="field__help field__help--error">
                {{ errors.storeId }}
              </p>
              <p v-if="errors.items" class="field__help field__help--error">
                {{ errors.items }}
              </p>
              <div class="reserve-trap" aria-hidden="true" inert>
                <label
                  >Ваш сайт<input
                    v-model="form.website"
                    name="website"
                    tabindex="-1"
                    autocomplete="off"
                /></label>
              </div>
              <SmartCaptcha
                v-if="captchaEnabled"
                :reset-signal="captchaReset"
                @passed="captchaToken = $event"
                @failed="captchaToken = ''"
              />
              <p
                v-if="errors.captcha"
                class="field__help field__help--error"
                role="alert"
              >
                {{ errors.captcha }}
              </p>
              <div class="reserve-consents">
                <div>
                  <UiCheckbox
                    v-model="form.consent"
                    name="consent"
                    required
                    label="Согласен(на) на обработку моих персональных данных (имя, телефон, комментарий, перечень выбранных товаров и магазин) в целях обработки запроса на резерв."
                    :aria-invalid="!!errors.consent"
                  />
                  <p
                    v-if="errors.consent"
                    class="field__help field__help--error"
                  >
                    {{ errors.consent }}
                  </p>
                </div>
                <div v-if="telegramEnabled">
                  <UiCheckbox
                    v-model="form.consentTelegram"
                    name="consentTelegram"
                    required
                    label="Согласен(на) на передачу запроса через сервис Telegram (api.telegram.org), включая трансграничную передачу указанных персональных данных."
                    :aria-invalid="!!errors.consentTelegram"
                  />
                  <p
                    v-if="errors.consentTelegram"
                    class="field__help field__help--error"
                  >
                    {{ errors.consentTelegram }}
                  </p>
                </div>
                <p class="field__help">
                  Текст согласия —
                  <NuxtLink to="/personal-data" target="_blank"
                    >Согласие на обработку персональных данных</NuxtLink
                  >, подробности обработки —
                  <NuxtLink to="/privacy" target="_blank"
                    >Политика обработки персональных данных</NuxtLink
                  >.
                </p>
              </div>
              <p
                v-if="failure"
                role="alert"
                class="field__help field__help--error"
              >
                {{ failure }}
                <a :href="bunkerContacts.phoneHref">{{
                  bunkerContacts.phone
                }}</a>
              </p>
              <p v-if="blockingCount > 0" class="field__help" role="status">
                В списке есть позиции, недоступные в выбранном магазине ({{
                  blockingCount
                }}) — удалите их или выберите другой магазин.
              </p>
              <UiButton
                type="submit"
                size="large"
                :loading="pending"
                :disabled="blockingCount > 0"
                >{{
                  pending ? "Отправляем…" : "Отправить запрос на резерв"
                }}</UiButton
              >
            </form>
          </section>
        </div>

        <aside class="reserve-aside" aria-label="Как работает запрос на резерв">
          <h2>Как это работает</h2>
          <ol class="reserve-steps">
            <li>
              Вы отправляете список товаров и контакты — это запрос, а не
              покупка и не заказ с оплатой.
            </li>
            <li>Сотрудник магазина получает запрос и проверяет наличие.</li>
            <li>
              Вы приходите в выбранный магазин; сотрудник при необходимости
              проверит совершеннолетие по документу.
            </li>
            <li>Оплата и получение товара — только в самом магазине.</li>
          </ol>
          <p class="caption">
            Сайт не принимает оплату и не осуществляет доставку. Дистанционная
            продажа табачной и никотинсодержащей продукции запрещена законом;
            отправка запроса не обязывает вас к покупке и не означает продажу.
          </p>
          <section
            v-if="user && loyalty"
            class="account-block"
            aria-labelledby="reserve-bonus-title"
          >
            <h2 id="reserve-bonus-title">Бонусы</h2>
            <template v-if="loyalty.status === 'ok'">
              <p class="account-bonus__value">
                {{ loyalty.balance }}
                <span>{{ pluralBonus(loyalty.balance ?? 0) }}</span>
              </p>
              <p v-if="loyalty.program" class="caption">
                До {{ loyalty.program.maxPaidRatePercents }}% покупки можно
                оплатить баллами на кассе магазина.
              </p>
            </template>
            <p v-else-if="loyalty.status === 'unlinked'" class="caption">
              {{ loyalty.message ?? "Бонусная карта пока не привязана." }}
            </p>
            <p v-else class="caption">
              Не удалось загрузить бонусы — баланс можно уточнить на кассе
              магазина.
            </p>
          </section>
          <p class="caption">
            Вопрос по запросу:
            <a :href="bunkerContacts.phoneHref">{{ bunkerContacts.phone }}</a>
          </p>
        </aside>
      </div>
    </template>
  </UiContainer>
</template>
