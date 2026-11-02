import type { ProductImage } from "~~/shared/types/product";

/**
 * Перелистывание фото окна: несколько снимков — стрелки по hover/focus
 * на десктопе, свайп на тач-экранах. Общая логика карточки каталога и
 * галереи страницы товара, разметка у каждой своя.
 */
export function usePhotoFlip(images: () => ProductImage[]) {
  const selected = ref(0);
  const multiImage = computed(() => images().length > 1);
  const step = (direction: 1 | -1) => {
    const count = images().length;
    if (count < 2) return;
    selected.value = (selected.value + direction + count) % count;
  };
  /**
   * Свайп: горизонтальный жест листает фото и отменяет переход по
   * ссылке-подложке (в карточке), вертикальный жест и короткие касания
   * не мешают скроллу и навигации.
   */
  let touchStart: { x: number; y: number } | null = null;
  const onTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    touchStart =
      event.touches.length === 1 && touch
        ? { x: touch.clientX, y: touch.clientY }
        : null;
  };
  const onTouchEnd = (event: TouchEvent) => {
    const start = touchStart;
    touchStart = null;
    const touch = event.changedTouches[0];
    if (!start || event.changedTouches.length !== 1 || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      event.preventDefault();
      step(dx < 0 ? 1 : -1);
    }
  };
  return { selected, multiImage, step, onTouchStart, onTouchEnd };
}
