import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GetInsights, type InsightsView } from '@lectura/insights-application';
import { AdvanceBlocks } from '@lectura/reading-application';
import { ButtonComponent } from '@lectura/ui-components';
import { ConsistencySection } from './consistency.section';
import { OnPaceSection } from './on-pace.section';
import { PassesSection } from './passes.section';

/** "Avance": the insights of spec §4, all computed from the reading log and the plan. */
@Component({
  selector: 'lb-insights-page',
  imports: [RouterLink, ButtonComponent, ConsistencySection, OnPaceSection, PassesSection],
  template: `
    <h1 class="font-display text-heading-1" i18n="@@insights.title">Avance</h1>

    @if (failed()) {
      <p role="alert" class="mt-section font-semibold text-danger" i18n="@@insights.load-failed">
        No se pudo leer tu avance en este dispositivo. Revisa que el navegador permita guardar
        datos.
      </p>
    }

    @if (loaded()) {
      @if (view(); as view) {
        <div class="mt-section flex flex-col gap-section">
          <lb-on-pace-section [pace]="view.onPace" [today]="view.today" />
          <lb-consistency-section
            [streaks]="view.streaks"
            [month]="view.month"
            [today]="view.today"
          />
          <lb-passes-section [books]="view.books" />
        </div>
      } @else {
        <p class="mt-section" i18n="@@insights.empty">
          Tu avance aparecerá aquí en cuanto empieces tu plan y registres tu lectura.
        </p>
        <a lbButton class="mt-section" routerLink="/" i18n="@@insights.go-start">
          Empezar en Hoy
        </a>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsightsPage {
  private readonly advanceBlocks = inject(AdvanceBlocks);
  private readonly getInsights = inject(GetInsights);

  protected readonly view = signal<InsightsView | null>(null);
  protected readonly loaded = signal(false);
  protected readonly failed = signal(false);

  constructor() {
    void this.load();
  }

  // Blocks that started while the app was closed are recorded first, as on Hoy and Plan.
  private async load(): Promise<void> {
    try {
      await this.advanceBlocks.execute();
      this.view.set(await this.getInsights.execute());
      this.loaded.set(true);
    } catch {
      this.failed.set(true);
    }
  }
}
