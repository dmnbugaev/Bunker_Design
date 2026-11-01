<script setup lang="ts">
import { vapeExpress } from "~~/shared/content/bunker";
import { pluralPosition } from "~~/shared/utils/product";

// Раздел закрыт от индексации и открывается после подтверждения 18+
// (маршрут не входит в PUBLIC_ROUTES): продвижение устройств ограничено
// 38-ФЗ ст. 7, сайт — только справочник (см. AGENTS.md).
usePageSeo(
  "Б/у устройства",
  "Б/у устройства сети «Бункер»: комиссионный сервис Vape Express — трейд-ин, срочный выкуп, продажа проверенных устройств и ремонт. Условия — в сообществах ВКонтакте и Telegram.",
);
// Комиссионная ветка «Vape Express» приходит из МойСклад вместе с товарами
// (бренды б/у устройств): ветка без публикуемых
// товаров на сайт не выгружается — раздел каталога не показываем.
const { data: meta } = await useCatalogMeta();
const normalize = (value: string) =>
  value.trim().toLocaleLowerCase("ru").replace(/\s+/g, " ");
const usedRoot = computed(() =>
  (meta.value?.categories ?? []).find(
    (item) =>
      !item.parentId &&
      // В живом МойСклад корень ветки называется «Vape Express»,
      // прежняя папка — «Б/у устройства (VEX)»: принимаем оба имени.
      ["vape express", "б/у устройства (vex)"].includes(normalize(item.name)),
  ),
);
const usedCategories = computed(() =>
  (meta.value?.categories ?? []).filter(
    (item) => item.parentId === usedRoot.value?.id,
  ),
);
// "__used__" не существует в каталоге: без ветки запрос ничего не тянет
// (приём из reserve.vue для пустой выборки).
const { data: usedList } = await useProducts(() =>
  usedRoot.value
    ? { category: usedRoot.value.slug, limit: 8 }
    : { ids: "__used__", limit: 8 },
);
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
      v-if="usedRoot"
      class="used-catalog"
      aria-labelledby="used-catalog"
    >
      <div class="used-catalog__head">
        <h2 id="used-catalog">Каталог б/у устройств</h2>
        <p>
          Позиции ветки «{{ usedRoot.name }}»: цены и наличие — по магазинам
          сети, резерв — в удобную точку. Состояние и комплектацию уточняйте у
          сотрудников Vape Express.
        </p>
      </div>
      <nav
        v-if="usedCategories.length"
        class="subcategory-links"
        aria-label="Разделы б/у устройств"
      >
        <NuxtLink
          v-for="child in usedCategories"
          :key="child.id"
          :to="`/catalog/${child.slug}`"
        >
          {{ child.name }}
        </NuxtLink>
      </nav>
      <ProductGrid v-if="usedList?.items.length" :products="usedList.items" />
      <div class="used-catalog__foot">
        <NuxtLink
          :to="`/catalog/${usedRoot.slug}`"
          class="button button--secondary"
        >
          Открыть весь раздел
        </NuxtLink>
        <p v-if="usedList" class="used-catalog__count">
          В разделе — {{ usedList.total }}
          {{ pluralPosition(usedList.total) }} б/у устройств
        </p>
      </div>
    </section>
  </UiContainer>
</template>
