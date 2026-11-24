import type { Pace } from '@lectura/reading-domain';

/** Weekday names, Sunday first, as `LocalDate.dayOfWeek` numbers them. */
export const WEEKDAYS: readonly string[] = [
  $localize`:@@reading.weekday.sunday:domingo`,
  $localize`:@@reading.weekday.monday:lunes`,
  $localize`:@@reading.weekday.tuesday:martes`,
  $localize`:@@reading.weekday.wednesday:miércoles`,
  $localize`:@@reading.weekday.thursday:jueves`,
  $localize`:@@reading.weekday.friday:viernes`,
  $localize`:@@reading.weekday.saturday:sábado`,
];

/** Monday first, the way a Mexican calendar shows the week. */
export const WEEK_ORDER: readonly number[] = [1, 2, 3, 4, 5, 6, 0];

const chapters = (n: number) =>
  n === 1
    ? $localize`:@@reading.pace.one-chapter:1 capítulo`
    : $localize`:@@reading.pace.chapters:${n}:count: capítulos`;

const list = (items: string[]) =>
  items.length < 2
    ? items.join('')
    : `${items.slice(0, -1).join(', ')} ${$localize`:@@reading.pace.and:y`} ${items[items.length - 1]}`;

/** "3 capítulos al día", "3 capítulos al día; descanso: domingo" or each weekday's amount. */
export function describePace(pace: Pace): string {
  if (pace.paceByWeekday) {
    const days = WEEK_ORDER.map((day) => {
      const amount = pace.paceByWeekday?.[day] ?? 0;
      return amount
        ? `${WEEKDAYS[day]} ${amount}`
        : `${WEEKDAYS[day]} ${$localize`:@@reading.pace.rest-short:descanso`}`;
    });
    return $localize`:@@reading.pace.by-weekday:Por día: ${days.join(' · ')}:days:`;
  }
  const daily = $localize`:@@reading.pace.daily:${chapters(pace.chaptersPerDay)}:amount: al día`;
  if (!pace.restDays.length) return daily;
  const rest = WEEK_ORDER.filter((day) => pace.restDays.includes(day)).map((day) => WEEKDAYS[day]);
  return $localize`:@@reading.pace.daily-with-rest:${daily}:pace:; descanso: ${list(rest)}:days:`;
}
