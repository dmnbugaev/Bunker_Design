<script setup lang="ts">
// Высота плашки публикуется в --legal-notice-h: герой главной занимает
// ровно остаток экрана под плашку и шапку (см. .hero в pages.css).
const visible = ref(true);
const root = ref<HTMLElement | null>(null);
let observer: ResizeObserver | undefined;
function publishHeight() {
  // 0px (а не удаление) — чтобы герой после закрытия плашки забрал всю
  // высоту; дефолт 3rem в calc остаётся только для первого SSR-кадра.
  document.documentElement.style.setProperty(
    "--legal-notice-h",
    root.value && visible.value
      ? `${Math.round(root.value.offsetHeight)}px`
      : "0px",
  );
}
// flush: post — к моменту колбэка v-if уже снял элемент.
watch(visible, publishHeight, { flush: "post" });
onMounted(() => {
  publishHeight();
  // Переносы текста меняют высоту плашки на других ширинах экрана.
  observer = new ResizeObserver(publishHeight);
  if (root.value) observer.observe(root.value);
});
onBeforeUnmount(() => {
  observer?.disconnect();
  document.documentElement.style.setProperty("--legal-notice-h", "0px");
});
</script>

<template>
  <aside
    v-if="visible"
    ref="root"
    class="legal-notice"
    aria-label="Важная информация о сайте"
  >
    <div class="legal-notice__content">
      <span class="legal-notice__symbol" aria-hidden="true">!</span>
      <p>
        Информация на сайте носит ознакомительный характер и не является
        публичной офертой. Продажа и оплата товаров через сайт не
        осуществляются. Сайт предназначен для лиц старше 18 лет. Никотин
        вызывает зависимость и вредит здоровью. Подробнее —
        <NuxtLink to="/information">в информации о сайте</NuxtLink>.
      </p>
      <button
        type="button"
        class="legal-notice__close"
        aria-label="Закрыть юридическую информацию"
        @click="visible = false"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M1.5 1.5l11 11m0-11l-11 11"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>
  </aside>
</template>
