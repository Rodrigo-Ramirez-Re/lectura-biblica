import { render, screen } from '@testing-library/angular';
import { ColumnChartComponent, type ColumnItem } from './column-chart.component';

const items: ColumnItem[] = [
  { label: 'lun', value: 3, text: '3' },
  { label: 'sáb', value: 6, text: '6' },
];

async function renderChart(reference: { value: number; label: string } | null) {
  await render(
    `<lb-column-chart [items]="items" [reference]="reference" summary="Capítulos por día de la semana" />`,
    { imports: [ColumnChartComponent], componentProperties: { items, reference } },
  );
  return screen.getByRole('img', { name: 'Capítulos por día de la semana' });
}

describe('ColumnChartComponent (LB-027)', () => {
  it('draws a column per item with its value written above it', async () => {
    const chart = await renderChart(null);

    const heights = [...chart.querySelectorAll('rect')].map((rect) =>
      Number(rect.getAttribute('height')),
    );
    expect(heights).toHaveLength(2);
    expect(heights[1]).toBeCloseTo((heights[0] ?? 0) * 2);
    expect([...chart.querySelectorAll('text')].map((text) => text.textContent?.trim())).toEqual([
      '3',
      'lun',
      '6',
      'sáb',
    ]);
  });

  it('marks a reference with a dashed line named in the legend', async () => {
    const chart = await renderChart({ value: 3.4, label: 'Promedio diario: 3.4' });

    expect(chart.querySelector('line[stroke-dasharray]')).toBeTruthy();
    expect(screen.getByText('Promedio diario: 3.4')).toBeTruthy();
  });
});
