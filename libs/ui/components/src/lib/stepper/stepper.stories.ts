import type { Meta, StoryObj } from '@storybook/angular';
import { StepperComponent } from './stepper.component';

const meta: Meta<StepperComponent> = {
  title: 'Components/Stepper',
  component: StepperComponent,
  args: { value: 3, label: 'Capítulos', min: 1, max: 150 },
  render: (args) => ({
    props: args,
    template: `<lb-stepper [label]="label" [(value)]="value" [min]="min" [max]="max" />`,
  }),
};
export default meta;

type Story = StoryObj<StepperComponent>;

export const Default: Story = {};
export const AtMinimum: Story = { args: { value: 1 } };
export const AtMaximum: Story = { args: { value: 150 } };
