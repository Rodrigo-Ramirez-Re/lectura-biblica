import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Route } from '@angular/router';
import { ExportHistory, GetInsights } from '@lectura/insights-application';
import {
  AdvanceBlocks,
  CheckBackupReminder,
  ControlCurrentBlock,
  DeleteAllData,
  EditLogs,
  ExportBackup,
  GetBlockHistory,
  GetBookProgress,
  GetPlan,
  GetSchedule,
  GetToday,
  ImportBackup,
  LogReading,
  Notes,
  PlanTemplates,
  PostponeBackupReminder,
  PreviewBackup,
  SetBackupReminder,
  SetBlockGoal,
  StartDefaultPlan,
  UndoReading,
  UpdatePlan,
} from '@lectura/reading-application';
import { JournalReader, JournalWriter } from '@lectura/reading-domain';
import { IndexedDbJournal } from '@lectura/reading-infrastructure';
import { BOOK_SECTIONS } from '@lectura/catalog-util-book-sections';
import { appConfig } from './app.config';
import { appRoutes } from './app.routes';

describe('app composition (LB-034)', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: appConfig.providers }));

  it.each([
    AdvanceBlocks,
    CheckBackupReminder,
    ControlCurrentBlock,
    DeleteAllData,
    EditLogs,
    ExportBackup,
    ExportHistory,
    GetBlockHistory,
    GetBookProgress,
    GetInsights,
    GetPlan,
    GetSchedule,
    GetToday,
    ImportBackup,
    LogReading,
    Notes,
    PlanTemplates,
    PostponeBackupReminder,
    PreviewBackup,
    SetBackupReminder,
    SetBlockGoal,
    StartDefaultPlan,
    UndoReading,
    UpdatePlan,
  ] as Type<unknown>[])('wires %o', (useCase) => {
    expect(TestBed.inject(useCase)).toBeInstanceOf(useCase);
  });

  it('keeps the data in IndexedDB on this device', () => {
    expect(TestBed.inject(JournalReader)).toBeInstanceOf(IndexedDbJournal);
    expect(TestBed.inject(JournalWriter)).toBe(TestBed.inject(JournalReader));
  });

  it('adds the reading progress and notes sections to the book page', async () => {
    const sections = TestBed.inject(BOOK_SECTIONS);
    const components = await Promise.all(sections.map((section) => section.load()));

    expect(components).toHaveLength(2);
    expect(components.every((component) => typeof component === 'function')).toBe(true);
  });
});

describe('app routes (LB-006)', () => {
  const load = async (route: Route) =>
    route.loadComponent ? await route.loadComponent() : await route.loadChildren?.();

  it.each(appRoutes.map((route) => [route.path, route] as const))(
    'loads the screen of "%s"',
    async (_, route) => {
      expect(await load(route)).toBeTruthy();
    },
  );

  it('ends with the page for unknown addresses', () => {
    expect(appRoutes.at(-1)?.path).toBe('**');
  });
});
