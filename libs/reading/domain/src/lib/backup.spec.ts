import { bookCatalog } from '@lectura/catalog-domain';
import { LocalDate } from '@lectura/shared-kernel';
import { isBackupDue, parseBackup, summarize, toBackup } from './backup';
import { emptyJournal, type Journal, type ReadingLogRecord } from './journal';
import { defaultPlan } from './reading-plan';

const day = (iso: string) => {
  const parsed = LocalDate.parse(iso);
  if (!parsed.ok) throw new Error(iso);
  return parsed.value;
};

const log = (date: string, id = date): ReadingLogRecord => ({
  id,
  date,
  blockId: 'b1',
  bookId: 'abdias',
  startChapter: 1,
  chaptersRead: 3,
});

const journal: Journal = {
  settings: { lastBackupAt: null },
  plan: defaultPlan(day('2026-12-01'), bookCatalog),
  blocks: [
    {
      id: 'b1',
      cycle: 1,
      bookId: 'abdias',
      start: '2026-12-01',
      end: '2026-12-31',
      goalPasses: null,
      status: 'active',
    },
  ],
  logs: [log('2026-12-03'), log('2026-12-01')],
  notes: [],
};

const exported = () => JSON.stringify(toBackup(journal, new Date('2026-12-05T21:15:00.000Z')));

describe('backup (LB-013)', () => {
  it('carries the schema version, the app and every collection', () => {
    expect(JSON.parse(exported())).toMatchObject({
      schemaVersion: 1,
      app: 'lectura-biblica',
      exportedAt: '2026-12-05T21:15:00.000Z',
      plan: { name: 'Un libro al mes' },
      blocks: [{ id: 'b1' }],
      logs: [{ date: '2026-12-03' }, { date: '2026-12-01' }],
      notes: [],
    });
  });

  it('reads back what it exported', () => {
    const parsed = parseBackup(exported());

    expect(parsed.ok && parsed.value).toMatchObject(journal);
  });

  it('summarises a backup before importing it', () => {
    const parsed = parseBackup(exported());

    expect(parsed.ok && summarize(parsed.value)).toEqual({
      planName: 'Un libro al mes',
      logs: 2,
      firstDate: '2026-12-01',
      lastDate: '2026-12-03',
      exportedAt: '2026-12-05T21:15:00.000Z',
    });
  });

  it.each([
    ['text that is not JSON', 'hola', 'not-json'],
    ['JSON of another app', JSON.stringify({ app: 'otra', schemaVersion: 1 }), 'not-a-backup'],
    ['a list', '[]', 'not-a-backup'],
    [
      'a newer version',
      JSON.stringify({ ...JSON.parse(exported()), schemaVersion: 2 }),
      'newer-version',
    ],
    [
      'a log with no chapters',
      JSON.stringify({
        ...JSON.parse(exported()),
        logs: [{ ...log('2026-12-01'), chaptersRead: 0 }],
      }),
      'invalid',
    ],
    [
      'a date that is not a day',
      JSON.stringify({ ...JSON.parse(exported()), logs: [{ ...log('2026-12-01'), date: 'ayer' }] }),
      'invalid',
    ],
    [
      'a missing collection',
      JSON.stringify({ ...JSON.parse(exported()), blocks: undefined }),
      'invalid',
    ],
  ])('rejects %s', (_, text, error) => {
    expect(parseBackup(text)).toEqual({ ok: false, error });
  });

  it('accepts a backup with no plan yet', () => {
    const text = JSON.stringify(toBackup(emptyJournal, new Date('2026-12-05T00:00:00.000Z')));

    expect(parseBackup(text).ok).toBe(true);
  });
});

describe('backup reminder (LB-013)', () => {
  const withLogs = (days: number, lastBackupAt: string | null = null): Journal => ({
    ...journal,
    settings: { lastBackupAt },
    logs: Array.from({ length: days }, (_, i) => log(`2026-12-${String(i + 1).padStart(2, '0')}`)),
  });

  it('is not due before there are logs on 7 days', () => {
    expect(isBackupDue(withLogs(6), day('2026-12-10'))).toBe(false);
  });

  it('is due with logs on 7 days and no backup ever', () => {
    expect(isBackupDue(withLogs(7), day('2026-12-10'))).toBe(true);
  });

  it('counts days, not logs', () => {
    const sameDay: Journal = {
      ...journal,
      logs: Array.from({ length: 9 }, (_, i) => log('2026-12-01', `l${i}`)),
    };
    expect(isBackupDue(sameDay, day('2026-12-10'))).toBe(false);
  });

  it('is due again 30 days after the last backup', () => {
    expect(isBackupDue(withLogs(7, '2026-12-05T21:15:00.000Z'), day('2027-01-04'))).toBe(false);
    expect(isBackupDue(withLogs(7, '2026-12-05T21:15:00.000Z'), day('2027-01-05'))).toBe(true);
  });
});
