<script setup lang="ts">
import { bunkerContacts } from "~~/shared/content/bunker";
import type { SocialIconNetwork } from "~/components/common/SocialIcon.vue";
// Показываем только заполненные владельцем каналы: ссылка с пустым адресом
// вела бы на текущую страницу и выглядела бы нерабочей (данные — NEEDS-DATA).
// Кнопки без стрелок «вне сайта» — указ владельца: канал читается по
// значку, край кнопки остаётся ровным.
const socials = computed(() =>
  [
    {
      key: "contacts",
      to: "/contacts",
      label: "Контакты",
      icon: "phone" as SocialIconNetwork,
      external: false,
    },
    {
      key: "vk",
      to: bunkerContacts.vk,
      label: "ВКонтакте",
      icon: "vk" as SocialIconNetwork,
      external: true,
    },
    {
      key: "telegram",
      to: bunkerContacts.telegram,
      label: "Telegram",
      icon: "telegram" as SocialIconNetwork,
      external: true,
    },
    {
      key: "instagram",
      to: bunkerContacts.instagram,
      label: "Instagram",
      icon: "instagram" as SocialIconNetwork,
      external: true,
    },
    {
      key: "partnership",
      to: "/partners",
      label: "Партнёрам",
      icon: "briefcase" as SocialIconNetwork,
      external: false,
    },
  ].filter((item) => item.to !== ""),
);
</script>
<template>
  <UiContainer as="section" class="section">
    <div class="section-heading">
      <h2>Остаёмся на связи.</h2>
      <p>Каналы сети — в одном месте: пишите, звоните, приходите.</p>
    </div>
    <!-- Плитки-каналы одной равной сеткой: на десктопе весь ряд, на планшете
         — пара строк, на телефоне — ровный столбец на всю ширину. -->
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
            :size="28"
            class="contact-button__icon"
          />
          {{ social.label }}
        </a>
        <NuxtLink v-else :to="social.to" class="contact-button">
          <SocialIcon
            :network="social.icon"
            :size="28"
            class="contact-button__icon"
          />
          {{ social.label }}
        </NuxtLink>
      </template>
    </div>
  </UiContainer>
</template>
