<script setup lang="ts">
import { bunkerContacts } from "~~/shared/content/bunker";
// Показываем только заполненные владельцем каналы: ссылка с пустым адресом
// вела бы на текущую страницу и выглядела бы нерабочей (данные — NEEDS-DATA).
const socials = computed(() =>
  [
    {
      key: "partnership",
      to: "/partners",
      label: "Стать партнёром",
      external: false,
    },
    { key: "contacts", to: "/contacts", label: "Контакты", external: false },
    { key: "vk", to: bunkerContacts.vk, label: "ВКонтакте", external: true },
    {
      key: "telegram",
      to: bunkerContacts.telegram,
      label: "Telegram",
      external: true,
    },
    {
      key: "instagram",
      to: bunkerContacts.instagram,
      label: "Instagram",
      external: true,
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
              class="text-link"
              target="_blank"
              rel="noopener noreferrer"
              >{{ social.label }} ↗</a
            >
            <NuxtLink v-else :to="social.to" class="text-link"
              >{{ social.label }} ↗</NuxtLink
            >
          </template>
        </div>
      </div>
    </div></UiContainer
  >
</template>
