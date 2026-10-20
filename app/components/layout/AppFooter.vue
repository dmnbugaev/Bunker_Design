<script setup lang="ts">
import { bunkerContacts } from "~~/shared/content/bunker";
import { sellerRequisites } from "~~/shared/content/legal";
import type { SocialIconNetwork } from "~/components/common/SocialIcon.vue";

// Соцсети: только заполненные владельцем адреса (пустая ссылка вела бы
// на текущую страницу) — см. shared/content/bunker.ts и docs/NEEDS-DATA.md.
const socials = computed(() =>
  (
    [
      { key: "vk", to: bunkerContacts.vk, label: "ВКонтакте" },
      { key: "telegram", to: bunkerContacts.telegram, label: "Telegram" },
      { key: "instagram", to: bunkerContacts.instagram, label: "Instagram" },
    ] satisfies {
      key: SocialIconNetwork;
      to: string;
      label: string;
    }[]
  ).filter((item) => item.to !== ""),
);
const showMetaDisclaimer = computed(() => bunkerContacts.instagram !== "");
const { loggedIn } = useSessionUser();
const accountLink = computed(() =>
  loggedIn.value
    ? { to: "/account", label: "Личный кабинет" }
    : { to: "/login", label: "Войти" },
);
const siteLinks = [
  { to: "/catalog", label: "Каталог" },
  { to: "/stores", label: "Магазины" },
  { to: "/about", label: "О проекте" },
  { to: "/contacts", label: "Контакты" },
  { to: "/partners", label: "Стать партнёром" },
];
const clientLinks = computed(() => [
  { to: "/reserve", label: "Список выбранных" },
  { to: "/search", label: "Поиск товаров" },
  accountLink.value,
]);
// Реквизиты с пустыми значениями не показываем (данные владельца — NEEDS-DATA).
const requisites = computed(() =>
  [
    sellerRequisites.inn ? `ИНН ${sellerRequisites.inn}` : "",
    sellerRequisites.ogrnip ? `ОГРНИП ${sellerRequisites.ogrnip}` : "",
  ].filter(Boolean),
);
const { openSettings: openConsentSettings } = useConsentSettings();
function footerPhoneClick() {
  trackEvent("store_phone_click", { source: "footer" });
}
</script>
<template>
  <footer class="app-footer">
    <UiContainer class="footer-inner">
      <div class="footer-grid">
        <div class="footer-brand">
          <NuxtLink to="/" class="brand-link" aria-label="Бункер — главная"
            ><span class="brand-mark" aria-hidden="true"></span>БУНКЕР</NuxtLink
          >
          <p class="footer-brand__tagline">
            Сеть вейпшопов: справочный каталог ассортимента и бронирование
            выбранных товаров в магазин сети.
          </p>
          <nav
            v-if="socials.length"
            class="footer-socials"
            aria-label="Социальные сети Бункер"
          >
            <a
              v-for="social in socials"
              :key="social.key"
              :href="social.to"
              class="footer-socials__link"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="social.label"
              ><SocialIcon :network="social.key" :size="20"
            /></a>
          </nav>
        </div>
        <nav class="footer-col" aria-label="Разделы сайта">
          <h2>Разделы</h2>
          <NuxtLink v-for="link in siteLinks" :key="link.to" :to="link.to">{{
            link.label
          }}</NuxtLink>
        </nav>
        <nav class="footer-col" aria-label="Клиентам">
          <h2>Клиентам</h2>
          <NuxtLink
            v-for="link in clientLinks"
            :key="link.to"
            :to="link.to"
            >{{ link.label }}</NuxtLink
          >
        </nav>
        <div class="footer-note">
          <h2>На связи</h2>
          <a
            class="footer-note__phone"
            :href="bunkerContacts.phoneHref"
            @click="footerPhoneClick"
            >{{ bunkerContacts.phone }}</a
          >
          <p class="footer-note__meta">
            {{ bunkerContacts.hours }}<br />
            <a :href="`mailto:${bunkerContacts.email}`">{{
              bunkerContacts.email
            }}</a>
          </p>
          <p class="footer-note__meta">
            Информация на сайте предназначена для лиц старше 18 лет.
          </p>
          <p v-if="showMetaDisclaimer" class="footer-disclaimer">
            Instagram принадлежит компании Meta, признанной экстремистской
            организацией, деятельность которой запрещена на территории РФ.
          </p>
        </div>
      </div>
      <div class="footer-bottom">
        <p class="footer-bottom__legal">
          <span>© 2026 Бункер · {{ sellerRequisites.shortName }}</span>
          <span v-for="item in requisites" :key="item">{{ item }}</span>
        </p>
        <nav aria-label="Юридическая информация">
          <span
            class="footer-bottom__age"
            aria-label="Только для совершеннолетних"
            >18+</span
          ><NuxtLink to="/information">Информация о сайте</NuxtLink
          ><NuxtLink to="/privacy"
            >Политика обработки персональных данных</NuxtLink
          ><NuxtLink to="/personal-data"
            >Согласие на обработку персональных данных</NuxtLink
          ><button type="button" @click="openConsentSettings()">
            Файлы cookie
          </button>
        </nav>
      </div>
    </UiContainer>
  </footer>
</template>
