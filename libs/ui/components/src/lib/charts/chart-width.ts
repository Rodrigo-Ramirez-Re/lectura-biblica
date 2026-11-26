import {
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  type WritableSignal,
} from '@angular/core';

/**
 * Keeps `width` at the host's width in CSS pixels, so a chart draws its viewBox at real size and
 * its text and strokes look the same on a phone and a desktop. Call it from a constructor.
 */
export function trackHostWidth(width: WritableSignal<number>): void {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const destroyRef = inject(DestroyRef);
  afterNextRender(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      const measured = Math.round(entry?.contentRect.width ?? 0);
      if (measured > 0) width.set(measured);
    });
    observer.observe(host);
    destroyRef.onDestroy(() => observer.disconnect());
  });
}
