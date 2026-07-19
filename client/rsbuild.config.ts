import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  
  // reduce number of modules compiled during dev server startup so improves startup time
  dev: {
    lazyCompilation: true,
  },
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
