import { render, screen } from '@testing-library/angular';
import { FormControlDirective, FormFieldComponent } from './form-field.component';

async function renderField(hint?: string, error?: string) {
  await render(
    `<lb-form-field label="Fecha" [hint]="hint" [error]="error"><input lbControl type="date" /></lb-form-field>`,
    { imports: [FormFieldComponent, FormControlDirective], componentProperties: { hint, error } },
  );
  return screen.getByLabelText('Fecha');
}

describe('FormFieldComponent (LB-005)', () => {
  it('labels its control', async () => {
    expect((await renderField()).tagName).toBe('INPUT');
  });

  it('describes the control with its hint', async () => {
    const input = await renderField('Un día del bloque actual');

    expect(input.getAttribute('aria-describedby')).toBe(
      screen.getByText('Un día del bloque actual').id,
    );
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('marks the control invalid and describes the error', async () => {
    const input = await renderField('Un día del bloque actual', 'Elige una fecha pasada');

    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toContain(
      screen.getByText('Elige una fecha pasada').id,
    );
  });

  it('has no description when there is neither hint nor error', async () => {
    expect((await renderField()).getAttribute('aria-describedby')).toBeNull();
  });
});
