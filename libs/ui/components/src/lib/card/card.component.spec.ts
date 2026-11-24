import { Component } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { CardComponent } from './card.component';

@Component({
  imports: [CardComponent],
  template: `
    <section lbCard aria-labelledby="title">
      <h2 id="title">Hoy</h2>
      <p>Salmos 4–6</p>
    </section>
  `,
})
class Host {}

describe('CardComponent (LB-005)', () => {
  it('groups its content in a region named by its heading', async () => {
    await render(Host);

    const region = screen.getByRole('region', { name: 'Hoy' });
    expect(region).toHaveProperty('textContent', expect.stringContaining('Salmos 4–6'));
  });

  it('draws a raised surface from tokens', async () => {
    await render(Host);

    const classes = screen.getByRole('region').classList;
    expect(classes).toContain('bg-surface-raised');
    expect(classes).toContain('rounded-card');
  });
});
