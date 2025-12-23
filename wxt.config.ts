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
      },
    },
    data_collection_permissions: {
      dataCollectionPerformed: false,
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
