import { describePace } from './plan-text';

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
