<script setup lang="ts">
// Ключевая бизнес-модель сайта в трёх шагах: сайт — справочный каталог,
// покупка только офлайн (15-ФЗ). Секция объясняет сценарий до того, как
// пользователь дошёл до списка выбранных товаров.
const steps = [
  {
    number: "01",
    title: "Выберите магазин",
    text: "Цены и наличие в каталоге зависят от точки: выберите удобный магазин сети.",
  },
  {
    number: "02",
    title: "Соберите список",
    text: "Добавьте товары в список выбранных и отправьте запрос на резерв — он действует 24 часа.",
  },
  {
    number: "03",
    title: "Заберите на кассе",
    text: "Оплата и выдача — в магазине после проверки совершеннолетия по документу.",
  },
] as const;
</script>
<template>
  <UiContainer as="section" class="section"
    ><div class="section-heading">
      <h2>Резерв — просто.</h2>
      <p>Три шага от каталога до покупки в магазине.</p>
    </div>
    <ol class="steps-list">
      <li v-for="step in steps" :key="step.number" class="feature-block">
        <span class="caption steps-list__number">{{ step.number }}</span>
        <h3>{{ step.title }}</h3>
        <p>{{ step.text }}</p>
      </li>
    </ol>
    <div class="inline-actions section-footnote">
      <NuxtLink to="/stores" class="text-link">Выбрать магазин ↗</NuxtLink>
      <NuxtLink to="/catalog" class="text-link">Перейти в каталог ↗</NuxtLink>
    </div>
  </UiContainer>
</template>
