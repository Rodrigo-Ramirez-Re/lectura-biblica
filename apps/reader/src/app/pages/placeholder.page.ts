import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/** Stands in for Hoy and Plan until their stories (LB-011, LB-012) replace it. */
@Component({
  selector: 'lb-placeholder-page',
  template: `
    <h1 class="font-display text-heading-1">{{ title }}</h1>
    <p class="mt-3 text-on-surface-muted" i18n="@@reader.placeholder.text">
      Esta sección llegará pronto.
    </p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceholderPage {
  protected readonly title = inject(ActivatedRoute).snapshot.title;
}
