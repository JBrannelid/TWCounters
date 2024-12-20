import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { randomBytes } from 'crypto';
import { getDefaultHeaders } from './vite-config-utils';
import compression from 'vite-plugin-compression'; // Lägg till importen

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const nonce = randomBytes(16).toString('base64');

  return {
    base: '',
    plugins: [
      react(),
      {
        name: 'inject-nonce',
        transformIndexHtml(html) {
          return html.replace('%NONCE%', nonce).replace(
            '</head>',
            '<link rel="preload" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&family=Titillium+Web:wght@300;400;600;700&display=swap" as="style" crossorigin="anonymous"></head>'
          );
        },
      },
      // Lägg till kompression-pluginet
      compression({
        algorithm: 'gzip',  // Eller 'gzip' eller 'deflate' beroende på vad du föredrar
        ext: '.br',           // Komprimerade filer får denna extension
        threshold: 10240,     // Endast filer större än 10 KB komprimeras
        deleteOriginFile: false,  // Ta inte bort de ursprungliga filerna
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      headers: getDefaultHeaders(nonce),
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true,
      minify: 'esbuild',  // Snabbare minifiering med esbuild
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
    },
    preview: {
      port: 5173,
      headers: getDefaultHeaders(nonce),
    },
  };
});
