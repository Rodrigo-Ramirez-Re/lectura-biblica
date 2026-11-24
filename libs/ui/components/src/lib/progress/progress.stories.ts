import type { Meta, StoryObj } from '@storybook/angular';
import { ProgressComponent } from './progress.component';

const meta: Meta<ProgressComponent> = {
  title: 'Components/Progress',
  component: ProgressComponent,
  args: { value: 4, max: 150, label: 'Vuelta actual' },
  render: (args) => ({
    props: args,
    template: `<lb-progress [value]="value" [max]="max" [label]="label">capítulo {{ value }} de {{ max }}</lb-progress>`,
  }),
};
export default meta;

type Story = StoryObj<ProgressComponent>;

export const Started: Story = {};
export const Half: Story = { args: { value: 75 } };
export const Complete: Story = { args: { value: 150 } };
export const Empty: Story = { args: { value: 0 } };
