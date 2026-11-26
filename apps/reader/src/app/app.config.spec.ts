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
    const ordered = [...sections].sort((a, b) => a.order - b.order);
    const components = await Promise.all(ordered.map((section) => section.load()));

    // Feature libs are lazy-loaded, so even a test may only import them on demand.
    const today = await import('@lectura/reading-feature-today');
    expect(components).toEqual([today.BookProgressSection, today.BookNotesSection]);
  });
});

describe('app routes (LB-006)', () => {
  const load = async (route: Route) =>
    route.loadComponent ? await route.loadComponent() : await route.loadChildren?.();

  // Expected screens are imported on demand too: feature libs may only be lazy-loaded.
  const plan = () => import('@lectura/reading-feature-plan');
  it.each([
    ['', async () => (await import('@lectura/reading-feature-today')).TodayPage],
    ['plan', async () => (await plan()).PlanPage],
    ['plan/editar', async () => (await plan()).PlanEditorPage],
    ['plan/bloque/:blockId', async () => (await plan()).BlockPage],
    ['avance', async () => (await import('@lectura/insights-feature')).InsightsPage],
    ['libros', async () => (await import('@lectura/catalog-feature-books')).bookRoutes],
    ['acerca', async () => (await import('./pages/about.page')).AboutPage],
    ['instalar', async () => (await import('./pages/install.page')).InstallPage],
    ['**', async () => (await import('./pages/not-found.page')).NotFoundPage],
  ] as const)('loads the right screen for "%s"', async (path, screen) => {
    const route = appRoutes.find((candidate) => candidate.path === path);

    expect(route).toBeDefined();
    expect(await load(route as Route)).toBe(await screen());
  });

  it('has no route without a test above', () => {
    expect(appRoutes).toHaveLength(9);
  });

  it('ends with the page for unknown addresses', () => {
    expect(appRoutes.at(-1)?.path).toBe('**');
  });
});
