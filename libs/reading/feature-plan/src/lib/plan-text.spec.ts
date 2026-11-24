import { describeDuration, describePace } from './plan-text';

describe('describePace (LB-015)', () => {
  it('says the daily pace', () => {
    expect(describePace({ chaptersPerDay: 3, restDays: [], paceByWeekday: null })).toBe(
      '3 capítulos al día',
    );
    expect(describePace({ chaptersPerDay: 1, restDays: [], paceByWeekday: null })).toBe(
      '1 capítulo al día',
    );
  });

  it('names the rest days, Monday first', () => {
    expect(describePace({ chaptersPerDay: 4, restDays: [0, 6], paceByWeekday: null })).toBe(
      '4 capítulos al día; descanso: sábado y domingo',
    );
  });

  it('lists the amount of each weekday', () => {
    expect(
      describePace({ chaptersPerDay: 3, restDays: [], paceByWeekday: [0, 2, 2, 2, 2, 2, 5] }),
    ).toBe(
      'Por día: lunes 2 · martes 2 · miércoles 2 · jueves 2 · viernes 2 · sábado 5 · domingo descanso',
    );
  });
});

describe('describeDuration (LB-016)', () => {
  it.each([
    [{ unit: 'month', value: 1 }, 'Un libro por mes, leído las veces que quepan'],
    [{ unit: 'month', value: 2 }, 'Cada libro: 2 meses'],
    [{ unit: 'weeks', value: 1 }, 'Cada libro: 1 semana'],
    [{ unit: 'days', value: 10 }, 'Cada libro: 10 días'],
    [{ unit: 'passes', value: 3 }, 'Cada libro: hasta leerlo 3 veces'],
  ] as const)('describes %o', (block, text) => {
    expect(describeDuration(block)).toBe(text);
  });
});
