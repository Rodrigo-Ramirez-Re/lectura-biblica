import type { Meta, StoryObj } from '@storybook/angular';
import { LineChartComponent } from './line-chart.component';

const days = Array.from({ length: 10 }, (_, i) => `${i + 1} de dic`);
const expected = days.map((_, i) => (i + 1) * 3);

const meta: Meta<LineChartComponent> = {
  title: 'Charts/Line chart',
  component: LineChartComponent,
  args: {
    labels: days,
    axisLabels: days.map((_, i) => `${i + 1}`),
    summary: 'Capítulos leídos y esperados en diciembre',
    series: [
      { label: 'Leídos', values: [3, 6, 9, 9, 12, 18, 21, 24, 30, 36], style: 'solid' },
      { label: 'Según el plan', values: expected, style: 'dashed' },
    ],
  },
};
export default meta;

type Story = StoryObj<LineChartComponent>;

export const Ahead: Story = {};
export const Behind: Story = {
  args: {
    series: [
      { label: 'Leídos', values: [3, 3, 6, 6, 6, 9, 12, 12, 15, 18], style: 'solid' },
      { label: 'Según el plan', values: expected, style: 'dashed' },
    ],
  },
};
export const OneDay: Story = {
  args: {
    labels: ['1 de dic'],
    axisLabels: null,
    series: [
      { label: 'Leídos', values: [3], style: 'solid' },
      { label: 'Según el plan', values: [3], style: 'dashed' },
    ],
  },
};
