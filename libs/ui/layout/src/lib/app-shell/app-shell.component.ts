import { ChangeDetectionStrategy, Component, ElementRef, input, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent, type IconName } from '@lectura/ui-components';

export interface NavItem {
  readonly label: string;
  readonly link: string;
  readonly icon: IconName;
}

/**
 * Header, main region and navigation. The navigation is a bottom tab bar on small screens
 * (reachable with the thumb) and a bar under the header from `md` up.
 */
@Component({
  selector: 'lb-app-shell',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  template: `
    <a
      href="#contenido"
      (click)="skipToContent($event)"
      class="sr-only rounded-control bg-surface-raised px-4 py-2 text-primary focus-visible:not-sr-only focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:z-10 focus-visible:focus-ring"
      i18n="@@ui.app-shell.skip-link"
      >Saltar al contenido</a
    >
    <header class="border-b border-border bg-surface-raised">
      <div class="mx-auto flex max-w-content items-center px-gutter py-3">
        <span class="font-display text-heading-3">{{ appName() }}</span>
      </div>
    </header>
    <nav
      class="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface-raised md:static md:border-t-0 md:border-b"
      aria-label="Principal"
      i18n-aria-label="@@ui.app-shell.nav"
    >
      <ul class="mx-auto flex max-w-content justify-around md:justify-start md:gap-2 md:px-gutter">
        @for (item of items(); track item.link) {
          <li>
            <a
              [routerLink]="item.link"
              routerLinkActive="text-primary font-semibold"
              [routerLinkActiveOptions]="{ exact: item.link === '/' }"
              ariaCurrentWhenActive="page"
              class="flex min-h-touch min-w-touch flex-col items-center justify-center gap-0.5 px-3 py-1 text-body-sm text-on-surface-muted focus-visible:focus-ring md:flex-row md:gap-2"
            >
              <lb-icon [name]="item.icon" />
              <span>{{ item.label }}</span>
            </a>
          </li>
        }
      </ul>
    </nav>
    <main
      #main
      id="contenido"
      tabindex="-1"
      class="mx-auto max-w-content px-gutter pt-section pb-24 outline-none md:pb-section"
    >
      <ng-content />
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-h-dvh' },
})
export class AppShellComponent {
  readonly appName = input.required<string>();
  readonly items = input.required<readonly NavItem[]>();

  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');

  // A plain #fragment would resolve against the base href and navigate away from the screen.
  protected skipToContent(event: Event): void {
    event.preventDefault();
    this.main().nativeElement.focus();
  }
}
