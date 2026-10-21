<script setup lang="ts">
const { store, city, pickerOpen } = useStoreSelection();
</script>
<template>
  <UiContainer as="section" class="section"
    ><div class="section-heading">
      <h2>Ближе к вам.</h2>
      <p>Выберите город и точку, чтобы посмотреть её коллекцию.</p>
    </div>
    <div class="store-feature">
      <div class="store-feature__info">
        <span class="caption">{{ city?.name ?? "Ваш город" }}</span>
        <h3>{{ store?.name ?? "Начните с магазина" }}</h3>
        <p>Выберите точку, чтобы узнать наличие товаров в этом магазине.</p>
      </div>
      <div class="inline-actions">
        <UiButton
          variant="secondary"
          class="store-feature__cta"
          :class="{ 'store-feature__cta--idle': !store }"
          @click="pickerOpen = true"
          ><!-- Пин дублирует метку-пин триггера в шапке. Подпись собрана во
              flex-строку, чтобы пин центрировался по тексту, а не по базовой
              линии. -->
          <span class="store-feature__cta-label">
            <svg
              class="store-feature__cta-pin"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linejoin="round"
              />
              <circle
                cx="12"
                cy="10"
                r="3"
                stroke="currentColor"
                stroke-width="2"
              /></svg
            >{{ store ? "Изменить магазин" : "Выбрать магазин" }}</span
          ></UiButton
        >
      </div>
    </div></UiContainer
  >
</template>
