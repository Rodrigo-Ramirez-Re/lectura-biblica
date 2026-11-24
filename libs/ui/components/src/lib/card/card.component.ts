import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * A raised panel on a native `<section>`. Put the heading first inside it and point
 * `aria-labelledby` at it, so the section becomes a named region.
 */
@Component({
  selector: 'section[lbCard]',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex flex-col gap-3 rounded-card bg-surface-raised p-4 text-on-surface shadow-card',
  },
})
export class CardComponent {}
