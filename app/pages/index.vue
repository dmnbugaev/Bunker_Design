<script setup lang="ts">
import { websiteSchema } from "~~/shared/seo/schema";

const { data: meta, error, refresh } = await useCatalogMeta();
const ageConfirmed = useAgeConfirmed();
const categories = computed(
  () =>
    meta.value?.categories.filter((item) => !item.parentId).slice(0, 6) ?? [],
);
// Секции каталога (категории, товары, бренды) скрываются до
// подтверждения 18+: SSR-HTML для краулеров и неподтвердивших
// посетителей не содержит витрины регулируемой продукции
// (инвариант tests/legal.spec.ts).
const catalogVisible = computed(() => ageConfirmed.value);
usePageSeo(
  "Сеть вейпшопов",
  "Бункер — сеть вейпшопов: адреса магазинов, режим работы и справочный каталог ассортимента для лиц старше 18 лет.",
  undefined,
  { index: true },
);
const siteUrl = useRuntimeConfig().public.siteUrl || "https://bunker.example";
useHead({
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify(websiteSchema(siteUrl)),
    },
  ],
});
</script>
<template>
  <div class="home-page">
    <HeroSection />
    <div class="signal-strip" aria-hidden="true">
      <div class="signal-strip__track">
        <span
          >Бункер<span class="signal-strip__mark"></span>Смотри глубже<span
            class="signal-strip__mark"
          ></span
          >Найди свой магазин<span class="signal-strip__mark"></span
        ></span>
        <span
          >Бункер<span class="signal-strip__mark"></span>Смотри глубже<span
            class="signal-strip__mark"
          ></span
          >Найди свой магазин<span class="signal-strip__mark"></span
        ></span>
      </div>
    </div>
    <CategoriesSection
      v-if="catalogVisible && meta"
      :categories="categories"
    /><UiContainer v-else-if="catalogVisible && error" class="section"
      ><UiEmptyState title="Не удалось загрузить категории"
        >Попробуйте ещё раз.<template #action
          ><UiButton @click="refresh()">Повторить</UiButton></template
        ></UiEmptyState
      ></UiContainer
    ><PopularProductsSection
      v-if="catalogVisible"
    /><HowItWorksSection /><AboutSection /><StoresSection /><ContactsSection />
  </div>
</template>
