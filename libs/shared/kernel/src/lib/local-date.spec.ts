import { LocalDate } from './local-date';

const date = (text: string) => {
  const result = LocalDate.parse(text);
  if (!result.ok) throw new Error(`invalid ${text}`);
  return result.value;
};

describe('LocalDate (LB-011)', () => {
  it('parses and prints YYYY-MM-DD', () => {
    expect(date('2026-12-03').toString()).toBe('2026-12-03');
    expect(date('2026-12-03').year).toBe(2026);
    expect(date('2026-12-03').month).toBe(12);
    expect(date('2026-12-03').day).toBe(3);
  });

  it.each(['2026-13-01', '2026-02-30', '26-12-03', '2026-12-3', 'hoy', ''])(
    'rejects %s',
    (text) => {
      expect(LocalDate.parse(text)).toEqual({ ok: false, error: 'invalid-date' });
    },
  );

  it('accepts 29 February only in leap years', () => {
    expect(LocalDate.parse('2028-02-29').ok).toBe(true);
    expect(LocalDate.parse('2027-02-29').ok).toBe(false);
  });

  it('adds days across months and years', () => {
    expect(date('2026-12-31').plusDays(1).toString()).toBe('2027-01-01');
    expect(date('2027-03-01').plusDays(-1).toString()).toBe('2027-02-28');
  });

  it('finds the end of the month and the first of the next', () => {
    expect(date('2026-11-24').endOfMonth().toString()).toBe('2026-11-30');
    expect(date('2028-02-10').endOfMonth().toString()).toBe('2028-02-29');
    expect(date('2026-12-15').firstOfNextMonth().toString()).toBe('2027-01-01');
  });

  it('counts days between dates', () => {
    expect(date('2026-12-01').daysUntil(date('2026-12-31'))).toBe(30);
    expect(date('2026-12-31').daysUntil(date('2026-12-01'))).toBe(-30);
  });

  it('counts the calendar months a period spans', () => {
    expect(date('2026-12-01').monthsSpannedUntil(date('2026-12-31'))).toBe(1);
    expect(date('2026-12-20').monthsSpannedUntil(date('2027-01-05'))).toBe(2);
  });

  it('compares dates', () => {
    expect(date('2026-12-01').isBefore(date('2026-12-02'))).toBe(true);
    expect(date('2026-12-02').isAfter(date('2026-12-01'))).toBe(true);
    expect(date('2026-12-01').equals(date('2026-12-01'))).toBe(true);
  });

  it('knows the weekday', () => {
    expect(date('2026-12-03').dayOfWeek).toBe(4);
  });

  it('takes the local calendar day of a Date', () => {
    expect(LocalDate.fromDate(new Date(2026, 11, 3, 23, 59)).toString()).toBe('2026-12-03');
    expect(LocalDate.fromDate(new Date(2026, 11, 3, 0, 1)).toString()).toBe('2026-12-03');
  });

  it('converts back to a Date at local noon on the same day', () => {
    const value = date('2026-12-03').toDate();
    expect([value.getFullYear(), value.getMonth(), value.getDate()]).toEqual([2026, 11, 3]);
  });
});
