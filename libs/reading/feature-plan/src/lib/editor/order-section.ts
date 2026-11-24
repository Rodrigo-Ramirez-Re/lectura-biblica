import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { bookCatalog, orderTemplates, type OrderTemplate } from '@lectura/catalog-domain';
import type { PlanSettings } from '@lectura/reading-domain';
import { ButtonComponent, CardComponent } from '@lectura/ui-components';
import { ORDER_NAMES } from '../plan-text';

type OrderFields = Pick<PlanSettings, 'bookOrder' | 'excluded'>;

/**
 * "Orden de los libros" section of the plan editor (LB-017): a template, or the order by hand
 * with "Subir" / "Bajar" (usable with keyboard and screen readers), and books in or out.
 */
@Component({
  selector: 'lb-order-section',
  imports: [ButtonComponent, CardComponent],
  template: `
    <section lbCard aria-labelledby="order-title">
      <h2 id="order-title" class="text-heading-2" i18n="@@reading.editor.order">
        Orden de los libros
      </h2>
      <p class="text-body-sm text-on-surface-muted" i18n="@@reading.editor.order-hint">
        Solo cambia lo que falta por leer en este ciclo.
      </p>
      <div class="flex flex-wrap gap-2">
        @for (template of templates; track template) {
          <button lbButton variant="secondary" type="button" (click)="apply(template)">
            {{ names[template] }}
          </button>
        }
      </div>

      <ol class="flex flex-col">
        @for (bookId of order().bookOrder; track bookId; let index = $index; let last = $last) {
          <li class="flex items-center gap-2 border-b border-border py-1">
            <label class="flex min-h-touch flex-1 items-center gap-3">
              <input
                type="checkbox"
                class="size-5 accent-primary focus-visible:focus-ring"
                [checked]="!order().excluded.includes(bookId)"
                (change)="toggle(bookId)"
              />
              <span [class.text-on-surface-muted]="order().excluded.includes(bookId)">
                {{ index + 1 }}. {{ name(bookId) }}
              </span>
            </label>
            <button
              lbButton
              variant="ghost"
              type="button"
              [disabled]="index === 0"
              (click)="move(index, -1)"
              [attr.aria-label]="moveUpLabel(bookId)"
            >
              ↑
            </button>
            <button
              lbButton
              variant="ghost"
              type="button"
              [disabled]="last"
              (click)="move(index, 1)"
              [attr.aria-label]="moveDownLabel(bookId)"
            >
              ↓
            </button>
          </li>
        }
      </ol>
      <p class="sr-only" aria-live="polite">{{ announcement() }}</p>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderSection {
  readonly order = input.required<OrderFields>();
  readonly changed = output<Partial<PlanSettings>>();

  protected readonly templates: readonly OrderTemplate[] = [
    'by-chapters',
    'canonical',
    'new-testament-first',
  ];
  protected readonly names = ORDER_NAMES;
  protected readonly announcement = signal('');
  private readonly total = computed(() => this.order().bookOrder.length);

  protected name(bookId: string): string {
    return bookCatalog.find(bookId)?.name ?? bookId;
  }

  protected moveUpLabel(bookId: string): string {
    return $localize`:@@reading.editor.move-up:Subir ${this.name(bookId)}:book:`;
  }

  protected moveDownLabel(bookId: string): string {
    return $localize`:@@reading.editor.move-down:Bajar ${this.name(bookId)}:book:`;
  }

  protected apply(template: OrderTemplate): void {
    this.changed.emit({ bookOrder: orderTemplates[template](bookCatalog) });
    this.announcement.set(
      $localize`:@@reading.editor.order-applied:Orden aplicado: ${this.names[template]}:name:`,
    );
  }

  protected move(index: number, step: -1 | 1): void {
    const order = [...this.order().bookOrder];
    const [bookId] = order.splice(index, 1);
    order.splice(index + step, 0, bookId);
    this.changed.emit({ bookOrder: order });
    this.announcement.set(
      $localize`:@@reading.editor.moved:${this.name(bookId)}:book: ahora es el ${index + step + 1}:position: de ${this.total()}:total:`,
    );
  }

  protected toggle(bookId: string): void {
    const excluded = this.order().excluded;
    this.changed.emit({
      excluded: excluded.includes(bookId)
        ? excluded.filter((id) => id !== bookId)
        : [...excluded, bookId],
    });
  }
}
