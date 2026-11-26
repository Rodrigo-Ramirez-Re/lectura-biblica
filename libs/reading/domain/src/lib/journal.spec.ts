import { SCHEMA_VERSION, emptyJournal } from './journal';

describe('journal (LB-010)', () => {
  it('starts with no plan, no history and no backup', () => {
    expect(emptyJournal).toEqual({
      settings: { lastBackupAt: null, backupEveryDays: 30, backupReminderPostponedUntil: null },
      plan: null,
      blocks: [],
      logs: [],
      notes: [],
      templates: [],
    });
  });

  it('is at schema version 3 (LB-031)', () => {
    expect(SCHEMA_VERSION).toBe(3);
  });
});
