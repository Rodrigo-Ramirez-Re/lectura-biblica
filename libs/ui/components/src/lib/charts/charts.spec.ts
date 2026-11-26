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

describe('LineChartComponent — pointer and size (LB-034)', () => {
  afterEach(() => vi.unstubAllGlobals());

  async function renderWith(labels: string[], values: number[][]) {
    const lines: LineSeries[] = values.map((line, i) => ({
      label: i ? 'Según el plan' : 'Leídos',
      values: line,
      style: i ? 'dashed' : 'solid',
    }));
    const { fixture } = await render(
      `<lb-line-chart [series]="series" [labels]="labels" summary="Capítulos" />`,
      { imports: [LineChartComponent], componentProperties: { series: lines, labels } },
    );
    const svg = screen
      .getByRole('img', { name: 'Capítulos' })
      .querySelector('svg') as SVGSVGElement;
    svg.getBoundingClientRect = () => ({ left: 0, width: 320 }) as DOMRect;
    const pointer = async (type: string, clientX: number, pointerType = 'mouse') => {
      svg.dispatchEvent(
        Object.assign(new MouseEvent(type, { clientX, bubbles: true }), { pointerType }),
      );
      await fixture.whenStable();
    };
    return { fixture, svg, pointer };
  }

  const tooltip = () => screen.queryByTestId('chart-tooltip')?.textContent ?? null;

  it('shows the day under the pointer and hides it when the mouse leaves', async () => {
    const { pointer } = await renderWith(['1 de dic', '2 de dic', '3 de dic'], [[0, 5, 5]]);

    await pointer('pointermove', 316);
    expect(tooltip()).toContain('3 de dic');
    await pointer('pointermove', 0);
    expect(tooltip()).toContain('1 de dic');

    await pointer('pointerleave', 0);
    expect(tooltip()).toBeNull();
  });

  it('keeps a tapped day visible when the finger lifts', async () => {
    const { pointer } = await renderWith(['1 de dic', '2 de dic'], [[1, 2]]);

    await pointer('pointerdown', 316, 'touch');
    await pointer('pointerleave', 316, 'touch');

    expect(tooltip()).toContain('2 de dic');
  });

  it('shows the only day of a one-day chart wherever it is touched', async () => {
    const { pointer } = await renderWith(['1 de dic'], [[3], [3]]);

    await pointer('pointerdown', 40, 'touch');

    expect(tooltip()).toContain('Leídos: 3');
  });

  it('jumps to the first and last day with Home and End', async () => {
    const user = userEvent.setup();
    await renderWith(['1 de dic', '2 de dic', '3 de dic'], [[0, 5, 5]]);
    screen.getByRole('img', { name: 'Capítulos' }).focus();

    await user.keyboard('{End}');
    expect(tooltip()).toContain('3 de dic');
    await user.keyboard('{Home}');
    expect(tooltip()).toContain('1 de dic');
    await user.keyboard('{ArrowLeft}');
    expect(tooltip()).toContain('1 de dic');
  });

  it('draws at the width of its box, so text keeps its size', async () => {
    let resize: ResizeObserverCallback = () => undefined;
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          resize = callback;
        }
        observe = vi.fn();
        disconnect = disconnect;
      },
    );
    const { fixture, svg } = await renderWith(['1 de dic', '2 de dic'], [[1, 2]]);

    resize([{ contentRect: { width: 612.4 } } as ResizeObserverEntry], {} as ResizeObserver);
    await fixture.whenStable();
    expect(svg.getAttribute('viewBox')).toMatch(/^0 0 612 /);

    resize([{ contentRect: { width: 0 } } as ResizeObserverEntry], {} as ResizeObserver);
    await fixture.whenStable();
    expect(svg.getAttribute('viewBox')).toMatch(/^0 0 612 /);

    fixture.destroy();
    expect(disconnect).toHaveBeenCalled();
  });
});
