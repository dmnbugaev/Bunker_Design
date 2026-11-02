<script setup lang="ts">
import type { NuxtError } from "#app";
const props = defineProps<{ error: NuxtError }>();
const is404 = computed(() => props.error.statusCode === 404);
useSeoMeta({
  title: () =>
    is404.value ? "Страница не найдена — Бункер" : "Ошибка — Бункер",
  robots: "noindex, nofollow",
});
/**
 * Возврат на главную: с гидрацией — чистая смена состояния через
 * clearError (страница ошибки не «залипает»), без JS — обычная ссылка
 * с полной загрузкой главной. Один обработчик у логотипа и кнопки.
 */
const goHome = (event: MouseEvent) => {
  event.preventDefault();
  clearError({ redirect: "/" });
};
</script>
<template>
  <main class="page-shell container error-page">
    <a href="/" class="brand-link" aria-label="Бункер — главная" @click="goHome"
      ><span class="brand-mark" aria-hidden="true"></span>БУНКЕР</a
    >
    <p class="eyebrow">{{ error.statusCode }}</p>
    <h1>{{ is404 ? "Здесь пока пусто." : "Не удалось открыть страницу." }}</h1>
    <p>
      {{
        is404
          ? "Возможно, адрес изменился или такого предмета нет в коллекции."
          : "Попробуйте вернуться на главную и повторить действие."
      }}
    </p>
    <a href="/" class="button button--primary button--normal" @click="goHome"
      >На главную ↗</a
    >
  </main>
</template>
