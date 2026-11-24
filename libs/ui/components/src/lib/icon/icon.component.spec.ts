import { render } from '@testing-library/angular';
import { IconComponent } from './icon.component';

describe('IconComponent (LB-006)', () => {
  it('draws an inline SVG hidden from assistive technology', async () => {
    const { container } = await render(`<lb-icon name="today" />`, { imports: [IconComponent] });

    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.querySelectorAll('path').length).toBeGreaterThan(0);
  });
});
