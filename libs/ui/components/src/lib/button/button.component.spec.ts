import { Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { ButtonComponent, ButtonSize, ButtonVariant } from './button.component';

@Component({
  imports: [ButtonComponent],
  template: `
    <button lbButton [variant]="variant()" [size]="size()" type="button">Ya leí</button>
    <a lbButton href="/plan">Ver plan</a>
  `,
})
class Host {
  readonly variant = signal<ButtonVariant>('primary');
  readonly size = signal<ButtonSize>('md');
}

describe('ButtonComponent (LB-005)', () => {
  it.each<[ButtonVariant, string[]]>([
    ['primary', ['bg-primary', 'text-on-primary']],
    ['secondary', ['border-primary', 'text-primary']],
    ['ghost', ['bg-transparent', 'text-primary']],
    ['danger', ['border-danger', 'text-danger']],
  ])('styles the %s variant with semantic tokens', async (variant, classes) => {
    const { fixture } = await render(Host);
    fixture.componentInstance.variant.set(variant);
    await fixture.whenStable();

    expect([...screen.getByRole('button').classList]).toEqual(expect.arrayContaining(classes));
  });

  it.each<[ButtonSize, string]>([
    ['md', 'text-body-sm'],
    ['lg', 'text-body'],
  ])('sizes the %s button from the type scale', async (size, textClass) => {
    const { fixture } = await render(Host);
    fixture.componentInstance.size.set(size);
    await fixture.whenStable();

    expect(screen.getByRole('button').classList).toContain(textClass);
  });

  it('keeps a 44 px minimum touch target and a keyboard focus ring', async () => {
    await render(Host);

    const classes = screen.getByRole('button').classList;
    expect(classes).toContain('min-h-touch');
    expect(classes).toContain('min-w-touch');
    expect(classes).toContain('focus-visible:focus-ring');
  });

  it('keeps the native element, so a link stays a link and a button a button', async () => {
    await render(Host);

    expect(screen.getByRole('button', { name: 'Ya leí' }).tagName).toBe('BUTTON');
    expect(screen.getByRole('link', { name: 'Ver plan' })).toHaveProperty(
      'href',
      expect.stringContaining('/plan'),
    );
  });
});
