import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppShellComponent, type NavItem } from '@lectura/ui-layout';
import { appSettings } from './app-config';
import { UpdateNotice } from './pwa/update-notice';

@Component({
  imports: [RouterOutlet, AppShellComponent, UpdateNotice],
  selector: 'lb-root',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly appName = appSettings.appName;

  protected readonly navigation: readonly NavItem[] = [
    { label: $localize`:@@reader.nav.today:Hoy`, link: '/', icon: 'today' },
    { label: $localize`:@@reader.nav.plan:Plan`, link: '/plan', icon: 'plan' },
    { label: $localize`:@@reader.nav.books:Libros`, link: '/libros', icon: 'books' },
    { label: $localize`:@@reader.nav.about:Acerca de`, link: '/acerca', icon: 'about' },
  ];
}
