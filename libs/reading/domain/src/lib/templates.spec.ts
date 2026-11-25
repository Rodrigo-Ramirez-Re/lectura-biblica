import { bookCatalog } from '@lectura/catalog-domain';
import { LocalDate } from '@lectura/shared-kernel';
import { planSettings } from './journal';
import { defaultPlan } from './reading-plan';
import {
  applyTemplate,
  builtInTemplate,
  createTemplate,
  parseTemplateFile,
  templateFileName,
  toTemplateFile,
} from './templates';

const plan = {
  ...defaultPlan(LocalDate.of(2026, 12, 1), bookCatalog),
  chaptersPerDay: 5,
  pausedSince: null,
};

describe('plan templates (LB-022)', () => {
  it('offers "Un libro al mes" built in', () => {
    const template = builtInTemplate(bookCatalog);

    expect(template.name).toBe('Un libro al mes');
    expect(template.settings.chaptersPerDay).toBe(3);
  });

  it('saves the way one reads under a name', () => {
    const result = createTemplate('t1', '  Mi plan de 2027 ', planSettings(plan), bookCatalog);

    expect(result.ok && result.value).toMatchObject({
      id: 't1',
      name: 'Mi plan de 2027',
      settings: { name: 'Mi plan de 2027', chaptersPerDay: 5 },
    });
    expect(createTemplate('t2', ' ', planSettings(plan), bookCatalog)).toEqual({
      ok: false,
      error: 'empty-name',
    });
  });

  it('applies a template keeping the start date and the pause', () => {
    const paused = { ...plan, pausedSince: '2026-12-10' };

    const applied = applyTemplate(paused, builtInTemplate(bookCatalog));

    expect(applied).toMatchObject({
      name: 'Un libro al mes',
      chaptersPerDay: 3,
      startDate: '2026-12-01',
      pausedSince: '2026-12-10',
    });
  });

  it('names its file after the template', () => {
    expect(templateFileName({ name: 'Mi plan de 2027' })).toBe('plantilla-mi-plan-de-2027.json');
    expect(templateFileName({ name: 'Lectura rápida ¡ya!' })).toBe(
      'plantilla-lectura-rapida-ya.json',
    );
  });

  it('reads back an exported template with a new id', () => {
    const original = createTemplate('t1', 'Mío', planSettings(plan), bookCatalog);
    if (!original.ok) throw new Error('template');
    const text = JSON.stringify(toTemplateFile(original.value));

    const imported = parseTemplateFile(text, 'new-id', bookCatalog);

    expect(imported).toEqual({ ok: true, value: { ...original.value, id: 'new-id' } });
  });

  it('keeps only the settings: never the start date, the pause or unknown fields', () => {
    const paused = { ...plan, pausedSince: '2026-12-05' };
    const fromPlan = createTemplate('t1', 'Mío', paused, bookCatalog);
    const file = toTemplateFile({ id: 't', name: 'Mío', settings: planSettings(plan) });
    const text = JSON.stringify({
      ...file,
      template: { ...file.template, settings: { ...file.template.settings, extra: 'x' } },
    });
    const imported = parseTemplateFile(text, 'id', bookCatalog);

    for (const result of [fromPlan, imported]) {
      expect(result.ok && Object.keys(result.value.settings).sort()).toEqual(
        Object.keys(planSettings(plan)).sort(),
      );
    }
  });

  it.each([
    ['text that is not JSON', 'hola', 'not-json'],
    [
      'a backup instead of a template',
      '{"app":"lectura-biblica","schemaVersion":2}',
      'not-a-template',
    ],
    [
      'a newer version',
      '{"app":"lectura-biblica","kind":"plan-template","schemaVersion":99}',
      'newer-version',
    ],
    [
      'settings that are incomplete',
      '{"app":"lectura-biblica","kind":"plan-template","schemaVersion":2,"template":{"name":"x","settings":{}}}',
      'invalid',
    ],
  ])('rejects %s', (_, text, error) => {
    expect(parseTemplateFile(text, 'id', bookCatalog)).toEqual({ ok: false, error });
  });

  it('rejects a template whose order has unknown books', () => {
    const file = toTemplateFile({
      id: 't',
      name: 'Mal',
      settings: { ...planSettings(plan), bookOrder: ['xyz'] },
    });
    expect(parseTemplateFile(JSON.stringify(file), 'id', bookCatalog)).toEqual({
      ok: false,
      error: 'invalid-order',
    });
  });
});
