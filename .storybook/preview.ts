import type { Preview } from '@storybook/angular';
import { setCompodocJson } from "@storybook/addon-docs/angular";
import docJson from "../documentation.json";
import { applicationConfig } from '@storybook/angular';
import { provideIonicAngular } from '@ionic/angular/standalone';

setCompodocJson(docJson);

const preview: Preview = {
  decorators: [
    applicationConfig({
      providers: [provideIonicAngular()]
    })
  ],
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
};

export default preview;