import { render, screen, within } from '@testing-library/angular';
import { BarListComponent, type BarItem } from './bar-list.component';

const items: BarItem[] = [
  { label: 'Abdías', value: 31, text: '31 vueltas' },
  { label: 'Salmos', value: 0.4, text: '0 vueltas y 40 % de la siguiente' },
];

describe('BarListComponent (LB-025)', () => {
  it('lists every bar with its label and value in text', async () => {
    await render(`<lb-bar-list [items]="items" summary="Vueltas por libro" />`, {
      imports: [BarListComponent],
      componentProperties: { items },
    });

    const list = screen.getByRole('list', { name: 'Vueltas por libro' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows.map((row) => row.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      'Abdías 31 vueltas',
      'Salmos 0 vueltas y 40 % de la siguiente',
    ]);
  });

  it('draws the bars on one scale, from 0 to the largest', async () => {
    const { container } = await render(`<lb-bar-list [items]="items" summary="Vueltas" />`, {
      imports: [BarListComponent],
      componentProperties: { items },
    });

    const widths = [...container.querySelectorAll<HTMLElement>('.bg-primary')].map(
      (bar) => bar.style.width,
    );
    expect(widths[0]).toBe('100%');
    expect(parseFloat(widths[1] ?? '')).toBeCloseTo((0.4 / 31) * 100);
  });
});
