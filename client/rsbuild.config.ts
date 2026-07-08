import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  tools: {
    postcss: {
      postcssOptions: {
        plugins: [require('@tailwindcss/postcss')],
      },
    },
  },
  source: {
    alias: { '@': './src' },
  },
  server: {
    proxy: { '/api': 'http://localhost:8000' },
  },
});
