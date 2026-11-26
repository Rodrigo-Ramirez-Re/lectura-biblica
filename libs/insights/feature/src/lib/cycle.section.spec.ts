import type { CycleProgress, FinishEstimate } from '@lectura/insights-domain';
import { LocalDate } from '@lectura/shared-kernel';
import { provideSpanishLocale } from '@lectura/shared-util-i18n';
import { render, screen } from '@testing-library/angular';
import { CycleSection } from './cycle.section';

const cycle: CycleProgress = {
  cycle: 1,
  finished: 12,
  total: 66,
  end: LocalDate.of(2032, 6, 30),
  monthsLeft: 55,
  paused: false,
  complete: false,
};

async function renderSection(progress: Partial<CycleProgress>, finish: FinishEstimate) {
  await render(CycleSection, {
    providers: [provideSpanishLocale()],
    inputs: { cycle: { ...cycle, ...progress }, finish },
  });
}

const text = (testId: string) =>
  screen.getByTestId(testId).textContent?.replace(/\s+/g, ' ').trim();

describe('CycleSection (LB-026)', () => {
  it("shows the books finished and when the plan's cycle ends", async () => {
    await renderSection({}, { kind: 'too-early' });

    expect(screen.getByRole('progressbar', { name: 'Libros terminados del ciclo 1' })).toBeTruthy();
    expect(screen.getByText('12 de 66 libros')).toBeTruthy();
    expect(text('cycle-end')).toBe(
      'Según tu plan, este ciclo termina el 30 de junio de 2032 (faltan 55 meses, contando este).',
    );
    expect(screen.getByText(/Con una semana de lectura/)).toBeTruthy();
  });

  it('estimates the end at the pace of the last 30 days, saying so', async () => {
    await renderSection(
      {},
      { kind: 'estimate', end: LocalDate.of(2034, 3, 12), pace: 2.13, days: 30 },
    );

    expect(text('finish-estimate')).toBe(
      'A tu ritmo de los últimos 30 días (2.1 capítulos al día), terminarías este ciclo el 12 de marzo de 2034.',
    );
  });

  it('says when the pace is averaged since the plan started', async () => {
    await renderSection(
      {},
      { kind: 'estimate', end: LocalDate.of(2032, 6, 30), pace: 3, days: 10 },
    );

    expect(text('finish-estimate')).toContain(
      'A tu ritmo desde que empezaste (3 capítulos al día)',
    );
  });

  it('says the journey is complete', async () => {
    await renderSection({ complete: true }, { kind: 'complete' });

    expect(screen.getByText(/Completaste tu recorrido/)).toBeTruthy();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('explains that the end moves while paused', async () => {
    await renderSection({ paused: true }, { kind: 'paused' });

    expect(screen.getByText(/Tu plan está en pausa/)).toBeTruthy();
    expect(screen.queryByTestId('cycle-end')).toBeNull();
  });
});
