import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],
  autoIcons: {
    baseIconPath: 'public/icon.svg',
  },
  manifest: {
    name: 'Charognard for Instagram™',
    permissions: ['tabs', 'storage', 'alarms'],
    action: {
      default_title: 'Charognard for Instagram™',
    },
    browser_specific_settings: {
      gecko: {
        id: 'charognard-instagram@antoinek.fr',
        // @ts-ignore - WXT doesn't support this field yet (https://github.com/wxt-dev/wxt/issues/1975)
        data_collection_permissions: {
          required: ['none'],
        },
      },
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },
  }),
});
