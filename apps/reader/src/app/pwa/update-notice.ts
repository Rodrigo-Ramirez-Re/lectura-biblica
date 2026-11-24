import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  InjectionToken,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SwUpdate } from '@angular/service-worker';
import { ButtonComponent } from '@lectura/ui-components';
import { filter, map, merge } from 'rxjs';

export const RELOAD_PAGE = new InjectionToken<() => void>('RELOAD_PAGE', {
  providedIn: 'root',
  factory: () => {
    const location = inject(DOCUMENT).location;
    return () => location.reload();
  },
});

type UpdateState = 'none' | 'ready' | 'broken';

/**
 * Tells the person a new version is ready and reloads only when they ask: a silent reload could
 * interrupt them mid-log (ADR 0002). Data lives in IndexedDB, so it survives the reload.
 */
@Component({
  selector: 'lb-update-notice',
  imports: [ButtonComponent],
  template: `
    <div role="status" class="fixed inset-x-0 bottom-20 z-20 px-gutter md:top-4 md:bottom-auto">
      @if (state() !== 'none') {
        <div
          class="mx-auto flex max-w-content items-center justify-between gap-3 rounded-card bg-surface-raised p-3 text-on-surface shadow-raised"
        >
          @if (state() === 'ready') {
            <p i18n="@@reader.update.ready">Hay una versión nueva.</p>
          } @else {
            <p i18n="@@reader.update.broken">La aplicación necesita recargarse para seguir.</p>
          }
          <button lbButton type="button" (click)="reload()" i18n="@@reader.update.reload">
            Recargar
          </button>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateNotice {
  private readonly updates = inject(SwUpdate);
  private readonly reloadPage = inject(RELOAD_PAGE);

  protected readonly state = toSignal(
    merge(
      this.updates.versionUpdates.pipe(
        filter((event) => event.type === 'VERSION_READY'),
        map((): UpdateState => 'ready'),
      ),
      this.updates.unrecoverable.pipe(map((): UpdateState => 'broken')),
    ),
    { initialValue: 'none' as UpdateState },
  );

  protected async reload(): Promise<void> {
    if (this.state() === 'ready') await this.updates.activateUpdate();
    this.reloadPage();
  }
}
