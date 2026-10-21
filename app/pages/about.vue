<script setup lang="ts">
usePageSeo(
  "О Бункер",
  "Бункер — сеть специализированных магазинов. Информация об ассортименте, магазинах и способах связи.",
  undefined,
  {
    index: true,
    breadcrumbs: [{ label: "Главная", to: "/" }, { label: "О проекте" }],
  },
);
</script>
<template>
  <div class="about-page">
    <AboutHeroSection />
    <div class="signal-strip" aria-hidden="true">
      <div class="signal-strip__track">
        <span v-for="copy in 14" :key="copy"
          >Бункер<span class="signal-strip__mark"></span>Больше, чем
          вейпшоп<span class="signal-strip__mark"></span>Сеть магазинов<span
            class="signal-strip__mark"
          ></span
          >Заходи в гости<span class="signal-strip__mark"></span
        ></span>
      </div>
    </div>
    <AboutSection :show-link="false" /><ContactsSection />
  </div>
</template>
