import { InMemoryJournal } from '@lectura/reading-domain/testing';
import { LocalDate } from '@lectura/shared-kernel';
import { FixedClock, InMemoryFileSaver, SequentialIds } from '@lectura/shared-kernel/testing';
import {
  CheckBackupReminder,
  DeleteAllData,
  ExportBackup,
  ImportBackup,
  PreviewBackup,
} from './backup.use-cases';
import { AdvanceBlocks, StartDefaultPlan } from './plan.use-cases';
import { LogReading } from './today.use-cases';

const day = (iso: string) => {
  const parsed = LocalDate.parse(iso);
  if (!parsed.ok) throw new Error(iso);
  return parsed.value;
};

async function setup() {
  const journal = new InMemoryJournal();
  const clock = new FixedClock('2026-12-01');
  const ids = new SequentialIds();
  await new StartDefaultPlan(journal, journal, clock).execute('today');
  await new AdvanceBlocks(journal, journal, clock).execute();
  clock.set('2026-12-08');
  const log = new LogReading(journal, journal, clock, ids);
  for (let d = 1; d <= 7; d++) await log.execute({ chapters: 3, date: day(`2026-12-0${d}`) });
  const files = new InMemoryFileSaver();
  return {
    journal,
    clock,
    files,
    exportBackup: new ExportBackup(journal, journal, clock, files),
    importBackup: new ImportBackup(journal),
    deleteAll: new DeleteAllData(journal),
    reminder: new CheckBackupReminder(journal, clock),
  };
}

describe('ExportBackup (LB-013)', () => {
  it('downloads a dated JSON file with everything and remembers the export', async () => {
    const { exportBackup, files, journal } = await setup();

    await exportBackup.execute();

    const [file] = files.files;
    expect(file.fileName).toBe('lectura-biblica-respaldo-2026-12-08.json');
    expect(file.type).toBe('application/json');
    expect(JSON.parse(file.content)).toMatchObject({
      schemaVersion: 2,
      app: 'lectura-biblica',
      plan: { name: 'Un libro al mes' },
    });
    expect(JSON.parse(file.content).logs).toHaveLength(7);
    expect(journal.journal.settings.lastBackupAt).toBe('2026-12-08T12:00:00.000Z');
  });
});

describe('PreviewBackup (LB-013)', () => {
  it('describes a valid file', async () => {
    const { exportBackup, files } = await setup();
    await exportBackup.execute();

    expect(new PreviewBackup().execute(files.files[0].content)).toEqual({
      ok: true,
      value: {
        planName: 'Un libro al mes',
        logs: 7,
        firstDate: '2026-12-01',
        lastDate: '2026-12-07',
        exportedAt: '2026-12-08T12:00:00.000Z',
      },
    });
  });

  it('explains what is wrong with an invalid file', () => {
    expect(new PreviewBackup().execute('{}')).toEqual({ ok: false, error: 'not-a-backup' });
  });
});

describe('ImportBackup and DeleteAllData (LB-013)', () => {
  it('restores everything after deleting it (round trip)', async () => {
    const { exportBackup, files, deleteAll, importBackup, journal } = await setup();
    await exportBackup.execute();
    const before = journal.journal;

    await deleteAll.execute();
    expect(journal.journal.plan).toBeNull();
    expect(journal.journal.logs).toEqual([]);

    expect(await importBackup.execute(files.files[0].content)).toEqual({
      ok: true,
      value: undefined,
    });
    expect(journal.journal).toEqual(before);
  });

  it('leaves current data untouched when the file is invalid', async () => {
    const { importBackup, journal } = await setup();
    const before = journal.journal;

    expect(await importBackup.execute('no es un respaldo')).toEqual({
      ok: false,
      error: 'not-json',
    });
    expect(journal.journal).toBe(before);
  });
});

describe('CheckBackupReminder (LB-013)', () => {
  it('reminds after 7 days of logs without a backup, and not right after exporting', async () => {
    const { reminder, exportBackup } = await setup();
    expect(await reminder.execute()).toBe(true);

    await exportBackup.execute();

    expect(await reminder.execute()).toBe(false);
  });
});
