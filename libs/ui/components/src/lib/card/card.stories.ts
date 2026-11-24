import type { Meta, StoryObj } from '@storybook/angular';
import { CardComponent } from './card.component';

const meta: Meta<CardComponent> = {
  title: 'Components/Card',
  component: CardComponent,
  render: () => ({
    template: `
      <section lbCard aria-labelledby="card-title" class="max-w-content">
        <h2 id="card-title" class="font-display text-heading-2">Lectura de hoy</h2>
        <p>Salmos 4–6</p>
        <p class="text-body-sm text-on-surface-muted">1 de diciembre – 31 de enero</p>
      </section>`,
  }),
};
export default meta;

export const Default: StoryObj<CardComponent> = {};
