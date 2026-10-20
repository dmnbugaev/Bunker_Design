<script setup lang="ts">
import { validatePartnership } from "~~/shared/utils/partnership";
import { bunkerContacts } from "~~/shared/content/bunker";

usePageSeo(
  "Стать партнёром",
  "Оставьте заявку на сотрудничество с Бункер: расскажите о вашей компании, и мы свяжемся с вами.",
  undefined,
  {
    index: true,
    breadcrumbs: [{ label: "Главная", to: "/" }, { label: "Стать партнёром" }],
  },
);
const form = reactive({
  name: "",
  phone: "",
  city: "",
  company: "",
  offer: "",
  consent: false,
  consentTelegram: false,
  website: "",
});
const errors = ref<Record<string, string>>({});
const pending = ref(false);
const sent = ref(false);
const failure = ref("");
const formElement = ref<HTMLFormElement>();
const successElement = ref<HTMLElement>();
// Согласие на передачу через Telegram — только при настроенной доставке;
// тот же признак использует серверная валидация, расхождения быть не может.
const { data: integrationFlags } = await useFetch<{
  telegramNotify: boolean;
}>("/api/integration-flags");
const telegramEnabled = integrationFlags.value?.telegramNotify === true;

async function submit() {
  if (pending.value) return;
  failure.value = "";
  const validation = validatePartnership(form, {
    requireTelegramConsent: telegramEnabled,
  });
  errors.value = validation.errors;
  if (!validation.valid) {
    await nextTick();
    formElement.value
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
    return;
  }
  pending.value = true;
  try {
    await $fetch("/api/partnership", { method: "POST", body: form, retry: 0 });
    sent.value = true;
    Object.assign(form, {
      name: "",
      phone: "",
      city: "",
      company: "",
      offer: "",
      consent: false,
      consentTelegram: false,
      website: "",
    });
    await nextTick();
    successElement.value?.focus();
  } catch (error) {
    const response = error as {
      statusCode?: number;
      data?: { data?: { errors?: Record<string, string> } };
    };
    if (response.statusCode === 422 && response.data?.data?.errors) {
      errors.value = response.data.data.errors;
    }
    failure.value =
      response.statusCode === 429
        ? "Слишком много попыток. Попробуйте через 15 минут или свяжитесь с нами по телефону."
        : "Не удалось подтвердить отправку. Ваши данные остались в форме. Попробуйте позже или свяжитесь с нами по телефону.";
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <UiContainer class="page-shell partner-page">
    <UiBreadcrumbs
      :items="[{ label: 'Главная', to: '/' }, { label: 'Стать партнёром' }]"
    />
    <div class="partner-layout">
      <section class="partner-content" aria-labelledby="partner-title">
        <h1 id="partner-title">Стать<br />партнёром.</h1>
        <p class="partner-intro">
          Оставьте ваши контакты — обсудим сотрудничество с вашей компанией.
        </p>
        <div
          v-if="sent"
          ref="successElement"
          class="partner-success"
          tabindex="-1"
          role="status"
        >
          <span class="partner-check" aria-hidden="true">✓</span>
          <h2>Заявка отправлена</h2>
          <p>
            Спасибо за интерес к Бункер. Мы свяжемся с вами по указанному
            телефону.
          </p>
          <NuxtLink to="/" class="button button--secondary"
            >На главную</NuxtLink
          >
        </div>
        <form
          v-else
          ref="formElement"
          class="partner-form"
          novalidate
          :aria-busy="pending"
          @submit.prevent="submit"
        >
          <p class="caption">Все поля обязательны для заполнения.</p>
          <fieldset :disabled="pending">
            <legend class="sr-only">Контакты и компания</legend>
            <UiField
              v-model="form.name"
              label="ФИО"
              name="name"
              autocomplete="name"
              placeholder="Иванов Иван Иванович"
              required
              maxlength="150"
              :error="errors.name"
            />
            <UiField
              v-model="form.phone"
              label="Ваш телефон"
              name="phone"
              type="tel"
              autocomplete="tel"
              placeholder="+7 (999) 123-45-67"
              required
              maxlength="32"
              :error="errors.phone"
            />
            <UiField
              v-model="form.city"
              label="Город / регион"
              name="city"
              autocomplete="address-level2"
              placeholder="Москва"
              required
              maxlength="150"
              :error="errors.city"
            />
            <UiField
              v-model="form.company"
              label="Название компании"
              name="company"
              autocomplete="organization"
              placeholder="Ваша компания"
              required
              maxlength="150"
              :error="errors.company"
            />
            <UiField
              v-model="form.offer"
              label="Партнёрское предложение"
              name="offer"
              multiline
              placeholder="Опишите формат сотрудничества: например, оптовые закупки, совместные акции, поставка продукции в вашу сеть…"
              required
              maxlength="500"
              :error="errors.offer"
            />
            <div class="partner-trap" aria-hidden="true" inert>
              <label
                >Ваш сайт<input
                  v-model="form.website"
                  name="website"
                  tabindex="-1"
                  autocomplete="off"
              /></label>
            </div>
            <div>
              <UiCheckbox
                v-model="form.consent"
                name="consent"
                required
                label="Согласен(на) на обработку моих персональных данных (ФИО, телефон, город/регион, компания, текст предложения) в целях рассмотрения заявки о сотрудничестве."
                :aria-invalid="!!errors.consent"
                :aria-describedby="errors.consent ? 'consent-error' : undefined"
              />
              <p class="field__help partner-form__consent-links">
                Текст согласия —
                <NuxtLink to="/personal-data" target="_blank"
                  >Согласие на обработку персональных данных</NuxtLink
                >, подробности обработки —
                <NuxtLink to="/privacy" target="_blank"
                  >Политика обработки персональных данных</NuxtLink
                >.
              </p>
              <p
                v-if="errors.consent"
                id="consent-error"
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
                label="Согласен(на) на передачу заявки через сервис Telegram (api.telegram.org), включая трансграничную передачу указанных персональных данных."
                :aria-invalid="!!errors.consentTelegram"
                :aria-describedby="
                  errors.consentTelegram ? 'consent-telegram-error' : undefined
                "
              />
              <p
                v-if="errors.consentTelegram"
                id="consent-telegram-error"
                class="field__help field__help--error"
              >
                {{ errors.consentTelegram }}
              </p>
            </div>
          </fieldset>
          <p v-if="failure" role="alert" class="partner-error">
            {{ failure }}
            <a :href="bunkerContacts.phoneHref">{{ bunkerContacts.phone }}</a>
          </p>
          <UiButton type="submit" size="large" :loading="pending">{{
            pending ? "Отправляем…" : "Отправить заявку"
          }}</UiButton>
        </form>
      </section>
      <aside class="partner-visual" aria-label="Партнёрство с Бункер">
        <span class="partner-wordmark">БУНКЕР</span>
        <img
          src="/images/storefront.webp"
          alt="Постер сети «Бункер»"
          width="600"
          height="600"
        />
        <div class="partner-visual__caption">
          <p>Давайте<br />работать вместе.</p>
          <span>Открыты к сотрудничеству<br />с вашим бизнесом</span>
        </div>
      </aside>
    </div>
  </UiContainer>
</template>
