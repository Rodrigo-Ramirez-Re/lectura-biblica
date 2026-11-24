import type { Meta, StoryObj } from '@storybook/angular';
import { FormControlDirective, FormFieldComponent } from './form-field.component';

const meta: Meta<FormFieldComponent> = {
  title: 'Components/Form field',
  component: FormFieldComponent,
  args: { label: 'Fecha', hint: 'Un día del bloque actual', error: '' },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [FormControlDirective] },
    template: `
      <lb-form-field [label]="label" [hint]="hint" [error]="error" class="block max-w-content">
        <input lbControl type="date" />
      </lb-form-field>`,
  }),
};
export default meta;

type Story = StoryObj<FormFieldComponent>;

export const WithHint: Story = {};
export const WithError: Story = { args: { error: 'Elige una fecha pasada' } };
export const Plain: Story = { args: { hint: '' } };
