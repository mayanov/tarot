import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// The main stylesheet no longer holds up the first frame: index.html's own inline
// styles already paint the loader's sunset sky, so that shows at once while the
// stylesheet downloads, and the app starts (index.tsx) the moment it's in. (Build only;
// the dev server injects its CSS differently.)
const stylesheetAfterSky = () => ({
  name: 'stylesheet-after-sky',
  apply: 'build' as const,
  transformIndexHtml: {
    order: 'post' as const,
    handler: (html: string) => html.replace(
      /<link rel="stylesheet" crossorigin href="(\/assets\/index-[^"]+\.css)">/,
      (_m: string, href: string) =>
        `<script>window.__cssReady=new Promise(function(r){window.__cssIn=r;setTimeout(r,8000)});</script>` +
        `<link rel="preload" as="style" crossorigin href="${href}" onload="if(this.rel==='stylesheet'){window.__cssIn()}else{this.rel='stylesheet'}" onerror="window.__cssIn()">` +
        `<noscript><link rel="stylesheet" crossorigin href="${href}"></noscript>`,
    ),
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/',
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': 'http://localhost:3001',
      },
    },
    plugins: [react(), stylesheetAfterSky()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
