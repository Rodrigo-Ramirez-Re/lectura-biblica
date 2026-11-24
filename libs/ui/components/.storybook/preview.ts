import '@angular/localize/init';
import type { Decorator, Preview } from '@storybook/angular';

// Mirrors the app's theme setting: data-theme forces light or dark, absent follows the device.
const withTheme: Decorator = (story, context) => {
  const theme = context.globals['theme'];
  if (theme === 'auto') delete document.documentElement.dataset['theme'];
  else document.documentElement.dataset['theme'] = theme;
  return story();
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Theme',
      toolbar: {
        title: 'Tema',
        icon: 'mirror',
        items: [
          { value: 'auto', title: 'Automático' },
          { value: 'light', title: 'Claro' },
          { value: 'dark', title: 'Oscuro' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'auto' },
  decorators: [withTheme],
};

export default preview;
