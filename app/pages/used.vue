<script setup lang="ts">
import { vapeExpress } from "~~/shared/content/bunker";

// Раздел закрыт от индексации и открывается после подтверждения 18+
// (маршрут не входит в PUBLIC_ROUTES): продвижение устройств ограничено
// 38-ФЗ ст. 7, сайт — только справочник (см. AGENTS.md).
usePageSeo(
  "Б/у устройства",
  "Б/у устройства сети «Бункер»: комиссионный сервис Vape Express — трейд-ин, срочный выкуп, продажа проверенных устройств и ремонт. Условия — в сообществах ВКонтакте и Telegram.",
);
// Категория «Б/у устройства (VEX)» приходит из МойСклад вместе с товарами:
// пока папка пуста (или не выгружена) ссылки нет — блок каталога не показываем.
const { data: meta } = await useCatalogMeta();
const usedCategory = computed(() => {
  const normalize = (value: string) =>
    value.trim().toLocaleLowerCase("ru").replace(/\s+/g, " ");
  return (meta.value?.categories ?? []).find(
    (item) => normalize(item.name) === "б/у устройства (vex)",
  );
});
</script>

<template>
  <UiContainer class="page-shell used-page">
    <div class="page-heading">
      <h1>Б/у устройства.</h1>
      <p>
        Комиссионное направление сети «Бункер»: проверенные устройства б/у,
        обмен и выкуп. Витрина б/у позиций сети — в каталоге, условия обмена и
        ремонта — в сообществах Vape Express.
      </p>
    </div>
    <section class="contact-services" aria-labelledby="used-services">
      <div class="contact-services__head">
        <h2 id="used-services">{{ vapeExpress.name }}</h2>
        <p>
          Обмен, выкуп и продажа устройств с проверкой перед выдачей, ремонт
          техники. Условия и наличие — в сообществах сервиса.
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
      <div class="contact-services__actions">
        <a
          :href="vapeExpress.vk"
          class="button button--outline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ vapeExpress.name }} в ВКонтакте
        </a>
        <a
          :href="vapeExpress.telegram"
          class="button button--outline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ vapeExpress.name }} в Telegram
        </a>
      </div>
    </section>
    <section
      v-if="usedCategory"
      class="used-page__catalog"
      aria-labelledby="used-catalog"
    >
      <h2 id="used-catalog">Витрина сети</h2>
      <p>
        Позиции «{{ usedCategory.name }}» из магазинов сети: цены и наличие — на
        сайте, резерв — в ближайшем магазине.
      </p>
      <NuxtLink
        :to="`/catalog/${usedCategory.slug}`"
        class="button button--secondary"
      >
        Открыть в каталоге
      </NuxtLink>
    </section>
  </UiContainer>
</template>
