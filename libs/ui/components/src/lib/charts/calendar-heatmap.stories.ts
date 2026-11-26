import type { Meta, StoryObj } from '@storybook/angular';
import { CalendarHeatmapComponent, type CalendarCell } from './calendar-heatmap.component';

const cells: CalendarCell[] = Array.from({ length: 31 }, (_, i) => {
  const day = i + 1;
  if (day > 11) return { day, level: 0, tone: 'upcoming', detail: `${day} de diciembre` };
  if (day === 11) return { day, level: 0, tone: 'today', detail: `${day} de diciembre: hoy` };
  if (day === 6) return { day, level: 0, tone: 'rest', detail: `${day} de diciembre: descanso` };
  if (day === 9) return { day, level: 0, tone: 'missed', detail: `${day} de diciembre: sin leer` };
  const level = ((day % 4) + 1) as CalendarCell['level'];
  return { day, level, tone: 'read', detail: `${day} de diciembre: ${level * 2} capítulos` };
});

const meta: Meta<CalendarHeatmapComponent> = {
  title: 'Charts/Calendar heatmap',
  component: CalendarHeatmapComponent,
  args: {
    cells,
    firstWeekday: 2,
    label: 'Diciembre de 2026',
    legend: [
      { tone: 'read', label: 'Leído' },
      { tone: 'missed', label: 'Sin leer' },
      { tone: 'today', label: 'Hoy' },
      { tone: 'rest', label: 'Sin lectura prevista' },
    ],
  },
};
export default meta;

type Story = StoryObj<CalendarHeatmapComponent>;

export const December: Story = {};
