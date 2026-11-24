import { render, screen } from '@testing-library/angular';
import { ProgressComponent } from './progress.component';

async function renderProgress(value: number, max: number) {
  await render(
    `<lb-progress [value]="value" [max]="max" label="Vuelta actual">capítulo 4 de 150</lb-progress>`,
    {
      imports: [ProgressComponent],
      componentProperties: { value, max },
    },
  );
  return screen.getByRole('progressbar', { name: 'Vuelta actual' });
}

describe('ProgressComponent (LB-005)', () => {
  it('exposes its value, maximum and name to assistive technology', async () => {
    const bar = await renderProgress(4, 150);

    expect(bar.getAttribute('aria-valuenow')).toBe('4');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('150');
  });

  it('shows the caption as text, not only as a bar', async () => {
    await renderProgress(4, 150);

    expect(screen.getByText('capítulo 4 de 150')).toBeTruthy();
  });

  it('fills the bar in proportion to the value', async () => {
    const bar = await renderProgress(75, 150);

    expect((bar.firstElementChild as HTMLElement).style.width).toBe('50%');
  });

  it('never reports more than the maximum', async () => {
    const bar = await renderProgress(200, 150);

    expect(bar.getAttribute('aria-valuenow')).toBe('150');
    expect((bar.firstElementChild as HTMLElement).style.width).toBe('100%');
  });
});
