import { provideRouter } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { AppShellComponent } from './app-shell.component';

const meta: Meta<AppShellComponent> = {
  title: 'Layout/App shell',
  component: AppShellComponent,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  args: {
    appName: 'Lectura bíblica',
    items: [
      { label: 'Hoy', link: '/', icon: 'today' },
      { label: 'Plan', link: '/plan', icon: 'plan' },
      { label: 'Libros', link: '/libros', icon: 'books' },
      { label: 'Acerca de', link: '/acerca', icon: 'about' },
    ],
  },
  render: (args) => ({
    props: args,
    template: `
      <lb-app-shell [appName]="appName" [items]="items">
        <h1 class="font-display text-heading-1">Hoy</h1>
        <p>Salmos 4–6</p>
      </lb-app-shell>`,
  }),
};
export default meta;

export const Default: StoryObj<AppShellComponent> = {};
