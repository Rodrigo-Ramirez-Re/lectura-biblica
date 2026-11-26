import { ChangeDetectionStrategy, Component, input } from '@angular/core';

let nextId = 0;

export type ChartCell = string | number;

/** The data of a chart as a table, collapsed under "Ver como tabla" (spec §4 chart rules). */
@Component({
  selector: 'lb-chart-table',
  template: `
    <details class="mt-2">
      <summary
        class="cursor-pointer rounded-control font-semibold text-primary focus-visible:focus-ring"
        i18n="@@ui.chart-table.show"
      >
        Ver como tabla
      </summary>
      <!-- Focusable so keyboard users can scroll a long table (WCAG 2.1.1). -->
      <div
        class="mt-2 max-h-80 overflow-auto rounded-control focus-visible:focus-ring"
        tabindex="0"
        role="region"
        [attr.aria-labelledby]="captionId"
      >
        <table class="w-full border-collapse text-left text-body-sm">
          <caption class="sr-only" [id]="captionId">
            {{
              caption()
            }}
          </caption>
          <thead>
            <tr>
              @for (column of columns(); track $index) {
                <th scope="col" class="border-b border-border-strong px-2 py-1 font-semibold">
                  {{ column }}
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track $index) {
              <tr>
                @for (cell of row; track $index) {
                  @if ($first) {
                    <th scope="row" class="border-b border-border px-2 py-1 font-normal">
                      {{ cell }}
                    </th>
                  } @else {
                    <td class="border-b border-border px-2 py-1 tabular-nums">{{ cell }}</td>
                  }
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    </details>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ChartTableComponent {
  readonly caption = input.required<string>();
  /** The scroll box is named by the caption itself, so screen readers don't say it twice. */
  protected readonly captionId = `lb-chart-table-${nextId++}`;
  readonly columns = input.required<readonly string[]>();
  readonly rows = input.required<readonly (readonly ChartCell[])[]>();
}
