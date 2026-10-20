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
  <div>
    <UiContainer class="page-shell"
      ><UiBreadcrumbs
        :items="[{ label: 'Главная', to: '/' }, { label: 'О проекте' }]"
      />
      <div class="page-heading">
        <p class="eyebrow">Бункер / О нас</p>
        <h1>Бункер.<br />Больше, чем вейпшоп.</h1>
        <p>
          Сеть специализированных магазинов. На сайте можно ознакомиться с
          ассортиментом и найти ближайшую точку.
        </p>
      </div>
      <div class="about-editorial">
        <img
          src="/referens/izXs90gk5s97wMyS_xLFyCzYMEgZLmTxaKG05MC0K--_VA3i7UahgS4pQSRzBccoQo8RIqzFvhZvUq2B1QKPpLji.jpg"
          alt="Бункер"
          width="360"
          height="360"
          fetchpriority="high"
        />
        <div>
          <h2>Ассортимент<br />и магазины.</h2>
          <p>
            В ассортименте представлены POD-устройства и расходные материалы для
            них, кальяны и табак, системы нагревания, стики, напитки и снеки.
            Конкретные позиции можно посмотреть в каталоге.
          </p>
          <p>
            Каталог показывает сведения о товарах, ценах и наличии по магазинам.
            Информация носит ознакомительный характер и предназначена для лиц
            старше 18 лет. Никотин вызывает зависимость и вредит здоровью.
          </p>
          <NuxtLink to="/stores" class="text-link"
            >Посмотреть магазины ↗</NuxtLink
          >
        </div>
      </div></UiContainer
    ><AboutSection /><ContactsSection />
  </div>
</template>
