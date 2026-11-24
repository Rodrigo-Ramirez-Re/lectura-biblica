import { Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { StepperComponent } from './stepper.component';

@Component({
  imports: [StepperComponent],
  template: `<lb-stepper label="Capítulos" [(value)]="chapters" [min]="1" [max]="5" />`,
})
class Host {
  readonly chapters = signal(3);
}

async function setup() {
  const { fixture } = await render(Host);
  return {
    host: fixture.componentInstance,
    input: screen.getByLabelText('Capítulos') as HTMLInputElement,
    decrease: screen.getByRole('button', { name: 'Menos' }),
    increase: screen.getByRole('button', { name: 'Más' }),
    user: userEvent.setup(),
    fixture,
  };
}

describe('StepperComponent (LB-005)', () => {
  it('changes the value with the − and + buttons', async () => {
    const { host, increase, decrease, user } = await setup();

    await user.click(increase);
    expect(host.chapters()).toBe(4);

    await user.click(decrease);
    await user.click(decrease);
    expect(host.chapters()).toBe(2);
  });

  it('accepts a typed value', async () => {
    const { host, input, user } = await setup();

    await user.clear(input);
    await user.type(input, '5');
    await user.tab();

    expect(host.chapters()).toBe(5);
  });

  it('keeps the value within min and max', async () => {
    const { host, input, user, fixture } = await setup();

    await user.clear(input);
    await user.type(input, '9');
    await user.tab();
    expect(host.chapters()).toBe(5);

    host.chapters.set(1);
    await fixture.whenStable();
    expect(screen.getByRole('button', { name: 'Menos' })).toHaveProperty('disabled', true);
  });

  it('disables + at the maximum', async () => {
    const { host, fixture } = await setup();

    host.chapters.set(5);
    await fixture.whenStable();

    expect(screen.getByRole('button', { name: 'Más' })).toHaveProperty('disabled', true);
  });

  it('announces the new value politely', async () => {
    const { increase, user } = await setup();

    await user.click(increase);

    expect(screen.getByText('Capítulos: 4').getAttribute('aria-live')).toBe('polite');
  });
});
