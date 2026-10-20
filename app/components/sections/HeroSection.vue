<script setup lang="ts">
// Герой главной в системе «Бункера» (docs/design-system/DESIGN_SYSTEM.md):
// стартовая хореография как в design-kit/demo — заголовок раскрывается
// клипом, строки копирайта всплывают со стаггером, визуал влетает справа,
// три слоя дыма распускаются (bloom) по всей секции и уходят
// в бесконечный дрейф; дальше только реактивное движение. На касании
// и prefers-reduced-motion — статично.
const reduceMotion = ref(false);
let onPointer: ((event: PointerEvent) => void) | undefined;
onMounted(() => {
  reduceMotion.value = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (reduceMotion.value) return;
  let frame = 0;
  onPointer = (event: PointerEvent) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const visual = document.getElementById("hero-visual");
      if (!visual) return;
      const rect = visual.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      document.documentElement.style.setProperty(
        "--hero-tilt-x",
        `${(-y * 3).toFixed(2)}deg`,
      );
      document.documentElement.style.setProperty(
        "--hero-tilt-y",
        `${(x * 4).toFixed(2)}deg`,
      );
      document.documentElement.style.setProperty(
        "--hero-shift-x",
        `${(-x * 2).toFixed(2)}%`,
      );
      document.documentElement.style.setProperty(
        "--hero-shift-y",
        `${(-y * 2).toFixed(2)}%`,
      );
    });
  };
  window.addEventListener("pointermove", onPointer, { passive: true });
});
onBeforeUnmount(() => {
  if (onPointer) window.removeEventListener("pointermove", onPointer);
});
</script>

<template>
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero__atmosphere" aria-hidden="true">
      <span class="hero__smoke" />
      <span class="hero__smoke hero__smoke--two" />
      <span class="hero__smoke hero__smoke--three" />
      <span class="hero__spark" />
    </div>
    <UiContainer class="hero__inner">
      <div class="hero__copy">
        <p class="edition"><span class="edition__dot" />Сеть вейпшопов</p>
        <h1 id="hero-title" class="hero__title">
          <span>Твой Бункер.</span><span>Смотри глубже.</span>
        </h1>
        <p class="hero__intro">
          Каталог ассортимента сети: выберите магазин, чтобы увидеть наличие и
          цены. Бронирование — в выбранный магазин, оплата на месте.
        </p>
        <NuxtLink to="/catalog" class="button button--primary button--large"
          >Смотреть каталог <span aria-hidden="true">↗</span></NuxtLink
        >
      </div>
      <div id="hero-visual" class="hero__visual">
        <img
          class="hero__poster"
          src="/images/hero.webp"
          alt="Постер сети «Бункер»: фирменный персонаж с устройства в руках"
          width="720"
          height="960"
          fetchpriority="high"
        />
        <span class="hero__stamp" aria-hidden="true">Bunker · Vape shop</span>
      </div>
      <div class="hero__bottom">
        <NuxtLink to="/catalog" class="hero__bottom-link"
          >Каталог <span class="small-mark" aria-hidden="true">↗</span></NuxtLink
        >
        <NuxtLink to="/stores" class="hero__bottom-link"
          >Магазины сети
          <span class="small-mark" aria-hidden="true">✳</span></NuxtLink
        >
      </div>
    </UiContainer>
  </section>
</template>
