<script setup lang="ts">
import { bunkerContacts } from "~~/shared/content/bunker";
usePageSeo(
  "Контакты",
  "Контакты Бункер: телефон, электронная почта, ВКонтакте, Telegram, Instagram и карта всех магазинов сети.",
  undefined,
  {
    index: true,
    breadcrumbs: [{ label: "Главная", to: "/" }, { label: "Контакты" }],
  },
);
onMounted(() => trackEvent("contacts_page_view"));
function phoneClick() {
  trackEvent("store_phone_click", { source: "contacts-page" });
}
// Показываем только заполненные владельцем каналы: ссылка с пустым адресом
// вела бы на текущую страницу (данные — docs/NEEDS-DATA.md).
const socials = [
  { label: "ВКонтакте", href: bunkerContacts.vk, network: "vk" as const },
  {
    label: "Telegram",
    href: bunkerContacts.telegram,
    network: "telegram" as const,
  },
  {
    label: "Instagram",
    href: bunkerContacts.instagram,
    network: "instagram" as const,
  },
].filter((item) => item.href !== "");
</script>
<template>
  <UiContainer class="page-shell"
    ><UiBreadcrumbs
      :items="[{ label: 'Главная', to: '/' }, { label: 'Контакты' }]" />
    <div class="page-heading">
      <p class="eyebrow">Бункер / Контакты</p>
      <h1>На связи с вами.</h1>
      <p>
        Вопросы о магазинах и ассортименте можно направить по телефону, почте
        или через официальное сообщество.
      </p>
    </div>
    <div class="contact-grid">
      <section aria-labelledby="contacts-communication">
        <h2 id="contacts-communication">Связаться с нами</h2>
        <dl class="specifications specifications--contacts">
          <div>
            <dt>Телефон</dt>
            <dd>
              <a :href="bunkerContacts.phoneHref" @click="phoneClick">{{
                bunkerContacts.phone
              }}</a>
            </dd>
          </div>
          <div>
            <dt>Почта</dt>
            <dd>
              <a :href="`mailto:${bunkerContacts.email}`">{{
                bunkerContacts.email
              }}</a>
            </dd>
          </div>
          <div>
            <dt>Режим работы</dt>
            <dd>{{ bunkerContacts.hours }}</dd>
          </div>
          <div>
            <dt>Соцсети</dt>
            <dd>
              <ul class="contact-links">
                <li v-for="social in socials" :key="social.label">
                  <a
                    :href="social.href"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span class="contact-links__icon" aria-hidden="true"
                      ><SocialIcon :network="social.network" :size="26"
                    /></span>
                    <span>{{ social.label }}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </li>
              </ul>
            </dd>
          </div>
        </dl>
      </section>
      <section aria-labelledby="contacts-stores" class="contact-stores">
        <h2 id="contacts-stores">Сеть магазинов</h2>
        <p>
          Выберите город и точку, чтобы посмотреть её адрес, цену и наличие
          товаров. Перед визитом можно уточнить режим работы по телефону.
        </p>
        <NuxtLink to="/stores" class="button button--secondary"
          >Смотреть магазины <span aria-hidden="true">↗</span></NuxtLink
        >
      </section>
    </div>
    <StoresMapSection
  /></UiContainer>
</template>
