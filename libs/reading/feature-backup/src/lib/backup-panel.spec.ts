import { provideRouter, Router } from '@angular/router';
import {
  AdvanceBlocks,
  DeleteAllData,
  ExportBackup,
  ImportBackup,
  LogReading,
  PreviewBackup,
  StartDefaultPlan,
} from '@lectura/reading-application';
import { JournalReader } from '@lectura/reading-domain';
import { InMemoryJournal } from '@lectura/reading-domain/testing';
import { FixedClock, InMemoryFileSaver, SequentialIds } from '@lectura/shared-kernel/testing';
import { provideSpanishLocale } from '@lectura/shared-util-i18n';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { BackupPanel } from './backup-panel';

async function setup() {
  const journal = new InMemoryJournal();
  const clock = new FixedClock('2026-12-03');
  const ids = new SequentialIds();
  await new StartDefaultPlan(journal, journal, clock).execute('today');
  await new AdvanceBlocks(journal, journal, clock).execute();
  await new LogReading(journal, journal, clock, ids).execute({ chapters: 3 });
  const files = new InMemoryFileSaver();
  const result = await render(BackupPanel, {
    providers: [
      provideRouter([]),
      provideSpanishLocale(),
      { provide: JournalReader, useValue: journal },
      { provide: ExportBackup, useValue: new ExportBackup(journal, journal, clock, files) },
      { provide: PreviewBackup, useValue: new PreviewBackup() },
      { provide: ImportBackup, useValue: new ImportBackup(journal) },
      { provide: DeleteAllData, useValue: new DeleteAllData(journal) },
    ],
  });
  await result.fixture.whenStable();
  const navigate = vi
    .spyOn(result.fixture.debugElement.injector.get(Router), 'navigateByUrl')
    .mockResolvedValue(true);
  return { ...result, journal, files, navigate, user: userEvent.setup() };
}

const upload = (content: string) =>
  userEvent.upload(
    screen.getByLabelText('Importar respaldo'),
    new File([content], 'respaldo.json', { type: 'application/json' }),
  );

describe('BackupPanel (LB-013)', () => {
  it('says when no backup was ever exported', async () => {
    await setup();

    expect(screen.getByText('Aún no has exportado un respaldo.')).toBeTruthy();
  });

  it('exports a backup file and shows when', async () => {
    const { user, files, fixture } = await setup();

    await user.click(screen.getByRole('button', { name: 'Exportar respaldo' }));
    await fixture.whenStable();

    expect(files.files[0].fileName).toBe('lectura-biblica-respaldo-2026-12-03.json');
    expect(screen.getByText(/Último respaldo: 3 de diciembre de 2026/)).toBeTruthy();
  });

  it('previews a valid backup and replaces the data after confirming', async () => {
    const { user, files, fixture, journal, navigate } = await setup();
    await user.click(screen.getByRole('button', { name: 'Exportar respaldo' }));
    const backup = files.files[0].content;
    await new DeleteAllData(journal).execute();

    await upload(backup);
    await fixture.whenStable();
    const preview = await screen.findByRole('region', { name: 'Contenido del respaldo' });
    expect(preview.textContent).toContain('Un libro al mes');
    expect(preview.textContent).toContain('1 registro de lectura');
    expect(preview.textContent).toContain('reemplaza todos tus datos');

    await user.click(screen.getByRole('button', { name: 'Reemplazar mis datos' }));

    expect(journal.journal.logs).toHaveLength(1);
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('explains an invalid file and changes nothing', async () => {
    const { fixture, journal } = await setup();
    const before = journal.journal;

    await upload('{"app":"otra"}');
    await fixture.whenStable();

    expect(
      await screen.findByText('El archivo no es un respaldo de esta aplicación.'),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Reemplazar mis datos' })).toBeNull();
    expect(journal.journal).toBe(before);
  });

  it('asks to update the app for a backup of a newer version', async () => {
    const { fixture } = await setup();

    await upload('{"app":"lectura-biblica","schemaVersion":99}');
    await fixture.whenStable();

    expect(await screen.findByText(/versión más nueva/)).toBeTruthy();
  });

  it('deletes everything only after typing BORRAR', async () => {
    const { user, journal, navigate } = await setup();
    await user.click(screen.getByText('Borrar mis datos'));
    const deleteButton = screen.getByRole('button', { name: 'Borrar todo' });
    expect(deleteButton).toHaveProperty('disabled', true);

    await user.type(screen.getByLabelText('Escribe BORRAR para confirmar'), 'BORRAR');
    await user.click(deleteButton);

    expect(journal.journal.plan).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/');
  });
});
