<script setup lang="ts">
// Герой «О проекте» — только дым, слово и действие: статичное БУНКЕР
// с фирменным трекингом сайта, подзаголовок и кнопка каталога стоят
// колонной по центру контейнера (justify-items на __inner).
// Слово не анимируется (просьба владельца); подзаголовок и кнопка
// входят семейным hero-copy-in, дымы распускаются и дрейфуют; после
// входа — реактивный параллакс дымов за курсором. На касании и
// prefers-reduced-motion всё статично.
const root = ref<HTMLElement | null>(null);
let onPointer: ((event: PointerEvent) => void) | undefined;
onMounted(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia("(hover: none)").matches) return;
  let frame = 0;
  onPointer = (event: PointerEvent) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const section = root.value;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      section.style.setProperty("--par-x", x.toFixed(3));
      section.style.setProperty("--par-y", y.toFixed(3));
    });
  };
  window.addEventListener("pointermove", onPointer, { passive: true });
});
onBeforeUnmount(() => {
  if (onPointer) window.removeEventListener("pointermove", onPointer);
});
</script>

<template>
  <section ref="root" class="about-hero" aria-labelledby="about-hero-title">
    <div class="about-hero__atmosphere" aria-hidden="true">
      <span class="about-hero__smoke" />
      <span class="about-hero__smoke about-hero__smoke--two" />
    </div>
    <UiContainer class="about-hero__inner">
      <h1
        id="about-hero-title"
        class="about-hero__heading"
        aria-label="Бункер. Больше, чем вейпшоп"
      >
        <span class="about-hero__mega">
          <span class="about-hero__letters" aria-hidden="true"
            ><span class="about-hero__letter">Б</span
            ><span class="about-hero__letter">У</span
            ><span class="about-hero__letter">Н</span
            ><span class="about-hero__letter">К</span
            ><span class="about-hero__letter">Е</span
            ><span class="about-hero__letter">Р</span></span
          ><span class="visually-hidden">Бункер.</span>
        </span>
      </h1>
      <div class="about-hero__deck">
        <span class="about-hero__sub">Больше, чем вейпшоп</span>
        <NuxtLink to="/catalog" class="button button--primary button--large"
          >Смотреть каталог <span aria-hidden="true">↗</span></NuxtLink
        >
      </div>
    </UiContainer>
  </section>
</template>
