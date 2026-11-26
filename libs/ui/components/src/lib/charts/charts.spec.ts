import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { niceScale } from './chart-scale';
import { ChartTableComponent } from './chart-table.component';
import { LineChartComponent, type LineSeries } from './line-chart.component';

describe('niceScale (LB-023)', () => {
  it.each([
    [0, 4, 1],
    [3, 3, 1],
    [9, 10, 5],
    [30, 30, 10],
    [93, 100, 50],
    [150, 150, 50],
  ])('rounds %d up to %d in steps of a round number', (max, top, step) => {
    const scale = niceScale(max);
    expect(scale.top).toBe(top);
    expect(scale.step).toBe(step);
  });
});

const series: LineSeries[] = [
  { label: 'Leídos', values: [0, 5, 5], style: 'solid' },
  { label: 'Según el plan', values: [3, 6, 9], style: 'dashed' },
];

async function renderChart() {
  await render(
    `<lb-line-chart [series]="series" [labels]="labels" summary="Capítulos de diciembre" />`,
    {
      imports: [LineChartComponent],
      componentProperties: { series, labels: ['1 de dic', '2 de dic', '3 de dic'] },
    },
  );
  return screen.getByRole('img', { name: 'Capítulos de diciembre' });
}

describe('LineChartComponent (LB-023)', () => {
  it('draws one line per series and names them in a legend', async () => {
    const chart = await renderChart();

    expect(chart.querySelectorAll('path')).toHaveLength(2);
    expect(screen.getByText('Leídos')).toBeTruthy();
    expect(screen.getByText('Según el plan')).toBeTruthy();
  });

  it('tells the lines apart by dash, not only by colour', async () => {
    const chart = await renderChart();

    const dashes = [...chart.querySelectorAll('path')].map((path) =>
      path.getAttribute('stroke-dasharray'),
    );
    expect(dashes).toEqual([null, '6 4']);
  });

  it('shows the values of a day with the arrow keys', async () => {
    const user = userEvent.setup();
    const chart = await renderChart();

    chart.focus();
    await user.keyboard('{ArrowRight}{ArrowRight}');

    const tooltip = screen.getByTestId('chart-tooltip');
    expect(tooltip.textContent).toContain('2 de dic');
    expect(tooltip.textContent).toContain('Leídos: 5');
    expect(tooltip.textContent).toContain('Según el plan: 6');

    await user.keyboard('{Escape}');
    expect(screen.queryByTestId('chart-tooltip')).toBeNull();
  });
});

describe('ChartTableComponent (LB-023)', () => {
  it('offers the same data as a table', async () => {
    const user = userEvent.setup();
    await render(
      `<lb-chart-table caption="Capítulos de diciembre" [columns]="columns" [rows]="rows" />`,
      {
        imports: [ChartTableComponent],
        componentProperties: {
          columns: ['Día', 'Leídos', 'Según el plan'],
          rows: [
            ['1 de dic', 0, 3],
            ['2 de dic', 5, 6],
          ],
        },
      },
    );

    await user.click(screen.getByText('Ver como tabla'));

    const table = screen.getByRole('table', { name: 'Capítulos de diciembre' });
    expect(table.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(screen.getByRole('rowheader', { name: '2 de dic' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Según el plan' })).toBeTruthy();
  });
});
