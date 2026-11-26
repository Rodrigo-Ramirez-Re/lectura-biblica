import { bookCatalog } from '@lectura/catalog-domain';
import { LocalDate } from '@lectura/shared-kernel';
import { isBackupDue, parseBackup, postponeBackupReminder, summarize, toBackup } from './backup';
import {
  SCHEMA_VERSION,
  emptyJournal,
  planSettings,
  upgradeSettings,
  type Journal,
  type ReadingLogRecord,
} from './journal';
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
  settings: { ...emptyJournal.settings, lastBackupAt: null },
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
  templates: [],
};

const exported = () => JSON.stringify(toBackup(journal, new Date('2026-12-05T21:15:00.000Z')));

describe('backup (LB-013)', () => {
  it('carries the schema version, the app and every collection', () => {
    expect(JSON.parse(exported())).toMatchObject({
      schemaVersion: 3,
      app: 'lectura-biblica',
      exportedAt: '2026-12-05T21:15:00.000Z',
      plan: { name: 'Un libro al mes' },
      blocks: [{ id: 'b1' }],
      logs: [{ date: '2026-12-03' }, { date: '2026-12-01' }],
      notes: [],
    });
  });

  it('reads back what it exported', () => {
    const parsed = parseBackup(exported(), bookCatalog);

    expect(parsed.ok && parsed.value).toMatchObject(journal);
  });

  it('summarises a backup before importing it', () => {
    const parsed = parseBackup(exported(), bookCatalog);

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
      JSON.stringify({ ...JSON.parse(exported()), schemaVersion: SCHEMA_VERSION + 1 }),
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
    expect(parseBackup(text, bookCatalog)).toEqual({ ok: false, error });
  });

  it('accepts a backup with no plan yet', () => {
    const text = JSON.stringify(toBackup(emptyJournal, new Date('2026-12-05T00:00:00.000Z')));

    expect(parseBackup(text, bookCatalog).ok).toBe(true);
  });
});

describe('backup reminder (LB-013)', () => {
  const withLogs = (days: number, lastBackupAt: string | null = null): Journal => ({
    ...journal,
    settings: { ...emptyJournal.settings, lastBackupAt },
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

  it('is due again 30 days after the last backup (LB-031: on the 30th day)', () => {
    expect(isBackupDue(withLogs(7, '2026-12-05T21:15:00.000Z'), day('2027-01-03'))).toBe(false);
    expect(isBackupDue(withLogs(7, '2026-12-05T21:15:00.000Z'), day('2027-01-04'))).toBe(true);
  });
});

describe('backup consistency (LB-013 review)', () => {
  const base = () => JSON.parse(exported());
  const reject = (document: unknown) =>
    expect(parseBackup(JSON.stringify(document), bookCatalog)).toEqual({
      ok: false,
      error: 'invalid',
    });

  it('rejects an impossible date', () => {
    const document = base();
    document.logs[0].date = '2026-02-31';
    reject(document);
  });

  it('rejects a plan with unknown or repeated books, or with every book excluded', () => {
    reject({ ...base(), plan: { ...base().plan, bookOrder: ['abdias', 'xyz'] } });
    reject({ ...base(), plan: { ...base().plan, bookOrder: ['abdias', 'abdias'] } });
    reject({ ...base(), plan: { ...base().plan, bookOrder: ['abdias'], excluded: ['abdias'] } });
  });

  it('rejects a block of an unknown book or ending before it starts', () => {
    reject({ ...base(), blocks: [{ ...base().blocks[0], bookId: 'xyz' }] });
    reject({ ...base(), blocks: [{ ...base().blocks[0], end: '2026-11-30' }] });
  });

  it('rejects a log of a block that is not in the backup', () => {
    reject({ ...base(), logs: [{ ...base().logs[0], blockId: 'missing' }] });
  });

  it('rejects a last-backup time that is not an instant', () => {
    reject({ ...base(), settings: { ...emptyJournal.settings, lastBackupAt: 'x' } });
  });

  it('counts the 30 days from the local day of the last export', () => {
    // 2026-12-05 at 20:00 in Mexico City is already 2026-12-06 in UTC.
    const evening = new Date(2026, 11, 5, 20, 0).toISOString();
    const journalAt = (lastBackupAt: string): Journal => ({
      ...journal,
      settings: { ...emptyJournal.settings, lastBackupAt },
      logs: [...journal.logs, log('2026-12-20')],
    });

    expect(isBackupDue(journalAt(evening), day('2027-01-03'))).toBe(false);
    expect(isBackupDue(journalAt(evening), day('2027-01-04'))).toBe(true);
  });
});

describe('data model v2 (LB-014)', () => {
  /** A backup as the v1 app exported it: no pace per weekday, no pause, no templates. */
  const v1Backup = () => {
    const document = JSON.parse(exported());
    document.settings = { lastBackupAt: null };
    delete document.plan.paceByWeekday;
    delete document.plan.pausedSince;
    delete document.templates;
    return { ...document, schemaVersion: 1 };
  };

  it('migrates a v1 backup to v2 with the same plan, blocks and logs', () => {
    const parsed = parseBackup(JSON.stringify(v1Backup()), bookCatalog);

    expect(parsed.ok && parsed.value).toMatchObject({
      schemaVersion: 3,
      plan: { name: 'Un libro al mes', paceByWeekday: null, pausedSince: null },
      blocks: journal.blocks,
      logs: journal.logs,
      templates: [],
    });
  });

  it.each(['active', 'done', 'skipped', 'paused', 'replaced'])('accepts a %s block', (status) => {
    const document = JSON.parse(exported());
    document.blocks[0].status = status;
    expect(parseBackup(JSON.stringify(document), bookCatalog).ok).toBe(true);
  });

  it('carries the plan templates', () => {
    const settings = planSettings(defaultPlan(day('2026-12-01'), bookCatalog));
    const withTemplate = { ...journal, templates: [{ id: 't1', name: 'Mío', settings }] };
    const text = JSON.stringify(toBackup(withTemplate, new Date('2026-12-05T00:00:00.000Z')));

    const parsed = parseBackup(text, bookCatalog);
    expect(parsed.ok && parsed.value.templates.map((t) => t.name)).toEqual(['Mío']);
  });

  it('rejects a template whose order has unknown books', () => {
    const document = JSON.parse(exported());
    document.templates = [
      { id: 't1', name: 'Mal', settings: { ...document.plan, bookOrder: ['xyz'] } },
    ];
    expect(parseBackup(JSON.stringify(document), bookCatalog)).toEqual({
      ok: false,
      error: 'invalid',
    });
  });

  it('rejects an unknown block duration', () => {
    const document = JSON.parse(exported());
    document.plan.defaultBlock = { unit: 'years', value: 1 };
    expect(parseBackup(JSON.stringify(document), bookCatalog)).toEqual({
      ok: false,
      error: 'invalid',
    });
  });
});

describe('backup reminder tuning (LB-031)', () => {
  /** Logs on 1–7 December 2026 and a backup on the 5th unless said otherwise. */
  const at = (settings: Partial<Journal['settings']>, logDays = 7): Journal => ({
    ...journal,
    settings: { ...emptyJournal.settings, lastBackupAt: '2026-12-05T18:00:00.000Z', ...settings },
    logs: Array.from({ length: logDays }, (_, i) =>
      log(`2026-12-${String(i + 1).padStart(2, '0')}`),
    ),
  });

  it('reminds monthly by default', () => {
    expect(emptyJournal.settings.backupEveryDays).toBe(30);
    expect(isBackupDue(at({}), day('2027-01-03'))).toBe(false);
    expect(isBackupDue(at({}), day('2027-01-04'))).toBe(true);
  });

  it.each([
    [7, '2026-12-11', '2026-12-12'],
    [14, '2026-12-18', '2026-12-19'],
    [90, '2027-03-04', '2027-03-05'],
  ] as const)('reminds every %i days when chosen', (backupEveryDays, before, due) => {
    expect(isBackupDue(at({ backupEveryDays }), day(before))).toBe(false);
    expect(isBackupDue(at({ backupEveryDays }), day(due))).toBe(true);
  });

  it('never reminds when turned off, not even the first time', () => {
    expect(isBackupDue(at({ backupEveryDays: null }), day('2027-06-01'))).toBe(false);
    expect(isBackupDue(at({ backupEveryDays: null, lastBackupAt: null }), day('2027-06-01'))).toBe(
      false,
    );
  });

  it('does not remind when nothing was logged since the day of the last backup', () => {
    expect(isBackupDue(at({}, 4), day('2027-02-01'))).toBe(false);
  });

  it('counts a reading logged on the day of the backup, which may come after it (review)', () => {
    expect(isBackupDue(at({}, 5), day('2027-02-01'))).toBe(true);
  });

  it('keeps quiet while postponed and comes back on the day it was postponed to', () => {
    const postponed = at({ backupReminderPostponedUntil: '2027-01-12' });

    expect(isBackupDue(postponed, day('2027-01-11'))).toBe(false);
    expect(isBackupDue(postponed, day('2027-01-12'))).toBe(true);
  });

  it('postpones for 7 days', () => {
    expect(postponeBackupReminder(emptyJournal.settings, day('2027-01-05'))).toEqual({
      ...emptyJournal.settings,
      backupReminderPostponedUntil: '2027-01-12',
    });
  });

  it('still reminds the first time after logs on 7 days', () => {
    expect(isBackupDue(at({ lastBackupAt: null }, 6), day('2026-12-10'))).toBe(false);
    expect(isBackupDue(at({ lastBackupAt: null }, 7), day('2026-12-10'))).toBe(true);
  });
});

describe('data model v3 (LB-031)', () => {
  const v2Backup = () => {
    const document = JSON.parse(exported());
    document.settings = { lastBackupAt: '2026-12-01T10:00:00.000Z' };
    return { ...document, schemaVersion: 2 };
  };

  it('migrates a v2 backup with monthly reminders and nothing else changed', () => {
    const parsed = parseBackup(JSON.stringify(v2Backup()), bookCatalog);

    expect(parsed.ok && parsed.value).toMatchObject({
      schemaVersion: 3,
      settings: {
        lastBackupAt: '2026-12-01T10:00:00.000Z',
        backupEveryDays: 30,
        backupReminderPostponedUntil: null,
      },
      plan: { name: 'Un libro al mes' },
      blocks: journal.blocks,
      logs: journal.logs,
    });
  });

  it('carries the reminder settings', () => {
    const settings = {
      lastBackupAt: null,
      backupEveryDays: 7,
      backupReminderPostponedUntil: '2026-12-09',
    } as const;
    const text = JSON.stringify(
      toBackup({ ...journal, settings }, new Date('2026-12-05T00:00:00.000Z')),
    );

    const parsed = parseBackup(text, bookCatalog);
    expect(parsed.ok && parsed.value.settings).toEqual(settings);
  });

  it.each([
    ['an interval that is not offered', { backupEveryDays: 10 }],
    ['a postponement that is not a day', { backupReminderPostponedUntil: 'mañana' }],
  ])('rejects %s', (_, change) => {
    const document = JSON.parse(exported());
    document.settings = { ...document.settings, ...change };
    expect(parseBackup(JSON.stringify(document), bookCatalog)).toEqual({
      ok: false,
      error: 'invalid',
    });
  });

  it('rejects a v2 backup whose settings are missing', () => {
    expect(parseBackup(JSON.stringify({ ...v2Backup(), settings: null }), bookCatalog)).toEqual({
      ok: false,
      error: 'invalid',
    });
  });

  it('completes settings stored by version 2', () => {
    expect(upgradeSettings({ lastBackupAt: null })).toEqual(emptyJournal.settings);
  });
});
