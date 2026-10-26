<script setup lang="ts">
import { bunkerContacts, vapeExpress } from "~~/shared/content/bunker";

const { data: meta } = await useCatalogMeta();
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
const channels = computed(() =>
  [
    {
      key: "phone",
      label: "Телефон",
      value: bunkerContacts.phone,
      href: bunkerContacts.phoneHref,
      external: false,
      icon: "phone" as const,
      action: phoneClick,
    },
    {
      key: "email",
      label: "Почта",
      value: bunkerContacts.email,
      href: `mailto:${bunkerContacts.email}`,
      external: false,
      icon: null,
      action: undefined,
    },
    {
      key: "vk",
      label: "ВКонтакте",
      value: "bunker_vape",
      href: bunkerContacts.vk,
      external: true,
      icon: "vk" as const,
      action: undefined,
    },
    {
      key: "telegram",
      label: "Telegram",
      value: "bunker_store",
      href: bunkerContacts.telegram,
      external: true,
      icon: "telegram" as const,
      action: undefined,
    },
    {
      key: "instagram",
      label: "Instagram",
      value: "bunker_srtv",
      href: bunkerContacts.instagram,
      external: true,
      icon: "instagram" as const,
      action: undefined,
    },
  ].filter((item) => item.href !== ""),
);
// Сводка сети для боковой колонки: режим и состав точек из меты каталога.
const network = computed(() => {
  const cities = meta.value?.cities ?? [];
  const stores = meta.value?.stores ?? [];
  const parts = cities
    .map((city) => {
      const count = stores.filter((item) => item.cityId === city.id).length;
      return `${city.name} — ${count}`;
    })
    .join(", ");
  return {
    total: stores.length,
    detail: parts,
  };
});
</script>
<template>
  <UiContainer class="page-shell contacts-page">
    <div class="page-heading">
      <h1>На связи.</h1>
      <p>
        Вопрос о магазине, наличии или сотрудничестве — выберите удобный канал:
        ответим и поможем собрать список для резерва.
      </p>
    </div>
    <div class="contacts-layout">
      <section aria-labelledby="contacts-channels">
        <h2 id="contacts-channels" class="visually-hidden">Каналы связи</h2>
        <!-- Ведомость каналов: значок в фирменном параллелограмме, название
             и значение на hairline-строке — тот же мотив, что у списока
             магазинов и направлений. Без стрелок: канал читается по
             значку, край строки остаётся ровным. -->
        <div class="channel-list">
          <a
            v-for="channel in channels"
            :key="channel.key"
            :href="channel.href"
            :target="channel.external ? '_blank' : undefined"
            :rel="channel.external ? 'noopener noreferrer' : undefined"
            class="channel-row"
            @click="channel.action?.()"
          >
            <span class="channel-row__icon" aria-hidden="true">
              <SocialIcon
                v-if="channel.icon"
                :network="channel.icon"
                :size="22" />
              <svg
                v-else
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 6h18v12H3V6Zm0 1 9 6.5L21 7"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linejoin="round"
                /></svg
            ></span>
            <span class="channel-row__body">
              <span class="caption channel-row__label">{{
                channel.label
              }}</span>
              <strong class="channel-row__value">{{ channel.value }}</strong>
            </span>
          </a>
        </div>
      </section>
      <aside class="contacts-summary" aria-labelledby="contacts-summary">
        <h2 id="contacts-summary" class="contacts-summary__title">Сеть</h2>
        <dl class="contacts-summary__list">
          <div>
            <dt>Режим работы</dt>
            <dd>{{ bunkerContacts.hours }}</dd>
          </div>
          <div v-if="network.total">
            <dt>Магазины</dt>
            <dd>
              {{ network.total }} точек<template v-if="network.detail">
                · {{ network.detail }}</template
              >
            </dd>
          </div>
        </dl>
        <NuxtLink to="/stores" class="button button--secondary"
          >Смотреть магазины</NuxtLink
        >
      </aside>
    </div>
    <section aria-labelledby="contacts-services" class="contact-services">
      <div class="contact-services__head">
        <h2 id="contacts-services">{{ vapeExpress.name }}</h2>
        <p>
          Комиссионный сервис сети: обмен и выкуп устройств, проверенная техника
          б/у и ремонт. Условия и наличие — в сообществе ВКонтакте.
        </p>
      </div>
      <ul class="contact-services__list">
        <li
          v-for="service in vapeExpress.services"
          :key="service"
          class="badge"
        >
          {{ service }}
        </li>
      </ul>
      <a
        :href="vapeExpress.vk"
        class="button button--outline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ vapeExpress.name }} в ВКонтакте
      </a>
    </section>
    <StoresMapSection
  /></UiContainer>
</template>
