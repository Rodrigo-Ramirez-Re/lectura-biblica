import type { Habits } from '@lectura/insights-domain';
import { provideSpanishLocale } from '@lectura/shared-util-i18n';
import { render, screen } from '@testing-library/angular';
import { HabitsSection } from './habits.section';

const weekdays = [1, 2, 3, 4, 5, 6, 0].map((weekday) => ({
  weekday,
  average: weekday === 6 ? 6 : 3,
}));

async function renderSection(habits: Habits) {
  await render(HabitsSection, { providers: [provideSpanishLocale()], inputs: { habits } });
}

describe('HabitsSection (LB-027)', () => {
  it('shows the weekdays, the 7-day average and the days without reading', async () => {
    await renderSection({
      kind: 'habits',
      weekdays,
      dailyAverage: 27 / 7,
      last7Average: 3,
      zeroDays: 4,
    });

    expect(
      screen.getByRole('img', {
        name: 'Capítulos en promedio por día de la semana, de lunes a domingo',
      }),
    ).toBeTruthy();
    expect(screen.getByText('Tu promedio diario: 3.9 capítulos')).toBeTruthy();
    expect(screen.getByTestId('habits-last7').textContent).toBe(
      'Promedio de 7 días: 3 capítulos al día',
    );
    expect(screen.getByTestId('habits-zero').textContent).toBe(
      '4 días sin leer en los últimos 30.',
    );
  });

  it.each([
    [0, 'Ningún día sin leer en los últimos 30.'],
    [1, '1 día sin leer en los últimos 30.'],
  ])('says %d days without reading in words', async (zeroDays, text) => {
    await renderSection({ kind: 'habits', weekdays, dailyAverage: 3, last7Average: 3, zeroDays });

    expect(screen.getByTestId('habits-zero').textContent).toBe(text);
  });

  it('needs a week of reading', async () => {
    await renderSection({ kind: 'too-early' });

    expect(screen.getByText(/Con una semana de lectura verás/)).toBeTruthy();
    expect(screen.queryByRole('img')).toBeNull();
  });
});
