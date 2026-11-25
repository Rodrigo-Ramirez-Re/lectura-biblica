import { planSettings } from '@lectura/reading-domain';
import { InMemoryJournal } from '@lectura/reading-domain/testing';
import { FixedClock, InMemoryFileSaver, SequentialIds } from '@lectura/shared-kernel/testing';
import { AdvanceBlocks, StartDefaultPlan } from './plan.use-cases';
import { PlanTemplates } from './templates.use-cases';

async function setup() {
  const journal = new InMemoryJournal();
  const clock = new FixedClock('2026-12-01');
  await new StartDefaultPlan(journal, journal, clock).execute('today');
  await new AdvanceBlocks(journal, journal, clock).execute();
  const files = new InMemoryFileSaver();
  const plan = journal.journal.plan;
  if (!plan) throw new Error('no plan');
  return {
    journal,
    files,
    settings: { ...planSettings(plan), chaptersPerDay: 5 },
    templates: new PlanTemplates(journal, journal, new SequentialIds(), files),
  };
}

describe('PlanTemplates (LB-022)', () => {
  it('lists the built-in template first, then the saved ones', async () => {
    const { templates, settings } = await setup();
    await templates.save('Mi plan', settings);

    expect(await templates.list()).toEqual([
      { id: 'un-libro-al-mes', name: 'Un libro al mes', builtIn: true },
      { id: 'id-1', name: 'Mi plan', builtIn: false },
    ]);
  });

  it('applies a template from today, keeping the history', async () => {
    const { templates, settings, journal } = await setup();
    await templates.save('Cinco al día', settings);
    const blocks = journal.journal.blocks;

    await templates.apply('id-1');

    expect(journal.journal.plan).toMatchObject({
      name: 'Cinco al día',
      chaptersPerDay: 5,
      startDate: '2026-12-01',
    });
    expect(journal.journal.blocks).toEqual(blocks);
  });

  it('exports a template file and imports it as a new template', async () => {
    const { templates, settings, files } = await setup();
    await templates.save('Mi plan de 2027', settings);

    await templates.export('id-1');
    expect(files.files[0].fileName).toBe('plantilla-mi-plan-de-2027.json');

    expect(await templates.import(files.files[0].content)).toEqual({
      ok: true,
      value: 'Mi plan de 2027',
    });
    expect((await templates.list()).filter((t) => t.name === 'Mi plan de 2027')).toHaveLength(2);
  });

  it('rejects a file that is not a template and changes nothing', async () => {
    const { templates, journal } = await setup();

    expect(await templates.import('{"hola":1}')).toEqual({ ok: false, error: 'not-a-template' });
    expect(journal.journal.templates).toEqual([]);
  });

  it('deletes a saved template but never the built-in one', async () => {
    const { templates, settings } = await setup();
    await templates.save('Mi plan', settings);

    await templates.remove('id-1');
    expect(await templates.remove('un-libro-al-mes')).toEqual({ ok: false, error: 'built-in' });
    expect((await templates.list()).map((t) => t.id)).toEqual(['un-libro-al-mes']);
  });
});
