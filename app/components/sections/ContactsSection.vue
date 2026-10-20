<script setup lang="ts">
import { bunkerContacts } from "~~/shared/content/bunker";
import type { SocialIconNetwork } from "~/components/common/SocialIcon.vue";
// Показываем только заполненные владельцем каналы: ссылка с пустым адресом
// вела бы на текущую страницу и выглядела бы нерабочей (данные — NEEDS-DATA).
const socials = computed(() =>
  [
    {
      key: "partnership",
      to: "/partners",
      label: "Стать партнёром",
      icon: "briefcase" as SocialIconNetwork,
      external: false,
      mark: false,
    },
    {
      key: "contacts",
      to: "/contacts",
      label: "Контакты",
      icon: "phone" as SocialIconNetwork,
      external: false,
      mark: false,
    },
    {
      key: "vk",
      to: bunkerContacts.vk,
      label: "ВКонтакте",
      icon: "vk" as SocialIconNetwork,
      external: true,
      // Стрелка «вне сайта» у ВК владельцу не нужна — канал читается
      // и так, кнопка остаётся ровной по краю.
      mark: false,
    },
    {
      key: "telegram",
      to: bunkerContacts.telegram,
      label: "Telegram",
      icon: "telegram" as SocialIconNetwork,
      external: true,
      mark: true,
    },
    {
      key: "instagram",
      to: bunkerContacts.instagram,
      label: "Instagram",
      icon: "instagram" as SocialIconNetwork,
      external: true,
      mark: true,
    },
  ].filter((item) => item.to !== ""),
);
</script>
<template>
  <UiContainer as="section" class="section"
    ><div class="contact-section">
      <h2>Остаёмся на связи.</h2>
      <div>
        <p>
          Контакты сети и каналы Бункер — в одном месте. Откройте страницу
          контактов или перейдите в удобную социальную сеть.
        </p>
        <div class="contact-section__links">
          <template v-for="social in socials" :key="social.key">
            <a
              v-if="social.external"
              :href="social.to"
              class="contact-button"
              target="_blank"
              rel="noopener noreferrer"
            >
              <SocialIcon
                :network="social.icon"
                :size="30"
                class="contact-button__icon"
              />
              {{ social.label }}
              <span
                v-if="social.mark"
                class="contact-button__mark"
                aria-hidden="true"
                >↗</span
              >
            </a>
            <NuxtLink v-else :to="social.to" class="contact-button">
              <SocialIcon
                :network="social.icon"
                :size="30"
                class="contact-button__icon"
              />
              {{ social.label }}
            </NuxtLink>
          </template>
        </div>
      </div>
    </div></UiContainer
  >
</template>
