import { DOCUMENT, DestroyRef, Injector, afterNextRender, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, skip } from 'rxjs';

/**
 * After each in-app navigation (not the first load) focus moves to the screen's main heading, so
 * screen readers announce the new screen and keyboard users start from its top.
 */
export function focusHeadingOnNavigation(): void {
  const router = inject(Router);
  const document = inject(DOCUMENT);
  const injector = inject(Injector);

  router.events
    .pipe(
      filter((event) => event instanceof NavigationEnd),
      skip(1),
      takeUntilDestroyed(inject(DestroyRef)),
    )
    .subscribe(() =>
      afterNextRender(
        () => {
          const heading = document.querySelector<HTMLElement>('main h1');
          if (!heading) return;
          heading.setAttribute('tabindex', '-1');
          heading.focus();
        },
        { injector },
      ),
    );
}
