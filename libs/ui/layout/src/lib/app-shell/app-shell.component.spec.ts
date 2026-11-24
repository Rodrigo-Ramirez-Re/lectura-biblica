import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { AppShellComponent, type NavItem } from './app-shell.component';

@Component({ template: '<h1>Hoy</h1>' })
class TodayStub {}

@Component({ template: '<h1>Plan</h1>' })
class PlanStub {}

const items: NavItem[] = [
  { label: 'Hoy', link: '/hoy', icon: 'today' },
  { label: 'Plan', link: '/plan', icon: 'plan' },
];

async function setup() {
  const result = await render(
    `<lb-app-shell appName="Lectura bíblica" [items]="items"><p>Contenido</p></lb-app-shell>`,
    {
      imports: [AppShellComponent],
      componentProperties: { items },
      providers: [
        provideRouter([
          { path: 'hoy', component: TodayStub },
          { path: 'plan', component: PlanStub },
        ]),
      ],
    },
  );
  await result.navigate('/hoy');
  return result;
}

describe('AppShellComponent (LB-006)', () => {
  it('shows the app name and the main content', async () => {
    await setup();

    expect(screen.getByText('Lectura bíblica')).toBeTruthy();
    expect(screen.getByRole('main').textContent).toContain('Contenido');
  });

  it('links every navigation item with its label', async () => {
    await setup();

    const nav = screen.getByRole('navigation', { name: 'Principal' });
    expect(nav.querySelectorAll('a').length).toBe(2);
    expect(screen.getByRole('link', { name: 'Plan' }).getAttribute('href')).toBe('/plan');
  });

  it('marks the current screen with aria-current', async () => {
    const { fixture } = await setup();
    await fixture.whenStable();

    expect(screen.getByRole('link', { name: 'Hoy' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Plan' }).getAttribute('aria-current')).toBeNull();
  });

  it('offers a skip link first that moves focus to the main content', async () => {
    await setup();
    const user = userEvent.setup();

    await user.tab();
    const skip = screen.getByRole('link', { name: 'Saltar al contenido' });
    expect(document.activeElement).toBe(skip);

    await user.click(skip);
    expect(document.activeElement).toBe(screen.getByRole('main'));
  });
});
