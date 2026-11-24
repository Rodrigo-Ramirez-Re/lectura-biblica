import { provideRouter } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { BooksPage } from './books.page';

async function setup() {
  await render(BooksPage, { providers: [provideRouter([])] });
  return { user: userEvent.setup() };
}

describe('BooksPage (LB-009)', () => {
  it('groups the books by testament in canonical order with their chapters', async () => {
    await setup();

    const old = screen.getByRole('region', { name: 'Antiguo Testamento' });
    const links = within(old).getAllByRole('link');
    expect(links).toHaveLength(39);
    expect(links[0].textContent).toContain('Génesis');
    expect(links[0].textContent).toContain('50 capítulos');
    expect(
      within(screen.getByRole('region', { name: 'Nuevo Testamento' })).getAllByRole('link'),
    ).toHaveLength(27);
  });

  it('uses the singular for one-chapter books', async () => {
    await setup();

    expect(screen.getByRole('link', { name: /Abdías/ }).textContent).toContain('1 capítulo');
  });

  it('links each book to its page', async () => {
    await setup();

    expect(screen.getByRole('link', { name: /Abdías/ }).getAttribute('href')).toBe('/abdias');
  });

  it('filters by name ignoring accents and case', async () => {
    const { user } = await setup();

    await user.type(screen.getByRole('searchbox', { name: 'Buscar libro' }), 'jua');

    expect(
      screen.getAllByRole('link').map((link) => link.querySelector('span')?.textContent),
    ).toEqual(['Juan', '1 Juan', '2 Juan', '3 Juan']);
    expect(screen.queryByRole('region', { name: 'Antiguo Testamento' })).toBeNull();
  });

  it('says so when nothing matches', async () => {
    const { user } = await setup();

    await user.type(screen.getByRole('searchbox', { name: 'Buscar libro' }), 'xyz');

    expect(screen.getByRole('status').textContent).toContain('No hay libros con ese nombre.');
  });
});
