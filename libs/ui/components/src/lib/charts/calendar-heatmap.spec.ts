import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { CalendarHeatmapComponent, type CalendarCell } from './calendar-heatmap.component';

const cells: CalendarCell[] = Array.from({ length: 31 }, (_, i) => ({
  day: i + 1,
  level: i < 3 ? 3 : 0,
  tone: i < 3 ? 'read' : i === 3 ? 'today' : 'upcoming',
  detail: `${i + 1} de diciembre`,
}));

async function renderCalendar() {
  await render(
    `<lb-calendar-heatmap [cells]="cells" [firstWeekday]="2" label="Diciembre de 2026" />`,
    { imports: [CalendarHeatmapComponent], componentProperties: { cells } },
  );
  return screen.getByRole('group', { name: 'Diciembre de 2026' });
}

describe('CalendarHeatmapComponent (LB-024)', () => {
  it('starts the month on its weekday, Monday first', async () => {
    const calendar = await renderCalendar();

    // 1 December 2026 is a Tuesday: one blank (Monday) before it.
    const grid = calendar.querySelectorAll('.grid')[1];
    expect(grid?.children[0]?.tagName).toBe('SPAN');
    expect(grid?.children[1]?.getAttribute('aria-label')).toBe('1 de diciembre');
  });

  it('names every day and keeps only one in the tab order', async () => {
    const calendar = await renderCalendar();

    const days = within(calendar).getAllByRole('button');
    expect(days).toHaveLength(31);
    expect(days.filter((day) => day.tabIndex === 0)).toHaveLength(1);
  });

  it('shows the detail of the day tapped', async () => {
    const user = userEvent.setup();
    await renderCalendar();

    await user.click(screen.getByRole('button', { name: '3 de diciembre' }));

    expect(screen.getByText('3 de diciembre', { selector: 'p' })).toBeTruthy();
  });

  it('moves between days with the arrow keys, a week with up and down', async () => {
    const user = userEvent.setup();
    await renderCalendar();
    await user.click(screen.getByRole('button', { name: '1 de diciembre' }));

    await user.keyboard('{ArrowDown}{ArrowRight}');

    expect(document.activeElement?.getAttribute('aria-label')).toBe('9 de diciembre');
    expect(screen.getByText('9 de diciembre', { selector: 'p' })).toBeTruthy();
  });
});
