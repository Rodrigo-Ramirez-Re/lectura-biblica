import type { Meta, StoryObj } from '@storybook/angular';
import { ButtonComponent } from './button.component';

const meta: Meta<ButtonComponent> = {
  title: 'Components/Button',
  component: ButtonComponent,
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost', 'danger'] },
    size: { control: 'inline-radio', options: ['md', 'lg'] },
  },
  args: { variant: 'primary', size: 'md' },
  render: (args) => ({
    props: args,
    template: `<button lbButton type="button" [variant]="variant" [size]="size">Ya leí</button>`,
  }),
};
export default meta;

type Story = StoryObj<ButtonComponent>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Danger: Story = { args: { variant: 'danger' } };
export const Large: Story = { args: { size: 'lg' } };

export const AsLink: Story = {
  render: () => ({ template: `<a lbButton href="#">Ver plan</a>` }),
};

export const Disabled: Story = {
  render: () => ({ template: `<button lbButton type="button" disabled>Ya leí</button>` }),
};
