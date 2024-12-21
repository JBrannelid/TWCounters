import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { randomBytes } from 'crypto';
import { generateCSPString } from './src/lib/csp-config';
import compression from 'vite-plugin-compression';

const getSecurityHeaders = (nonce: string) => ({
  'Content-Security-Policy': generateCSPString(nonce),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': "camera=(), microphone=(), geolocation=()",
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
});

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const nonce = randomBytes(16).toString('base64');

  const config: UserConfig = {
    base: isProduction ? '' : '',
    plugins: [
      react(),
      {
        name: 'html-transform',
        transformIndexHtml: (html) => {
          const transforms = [
            [/<script/g, `<script nonce="${nonce}"`],
            [/<style/g, `<style nonce="${nonce}"`],
            [/<link([^>]*?)rel="stylesheet"/g, `<link$1rel="stylesheet" nonce="${nonce}"`],
            [
              '</head>',
              `<meta http-equiv="Content-Security-Policy" content="${generateCSPString(nonce)}">\n  </head>`
            ]
          ];

          return transforms.reduce((acc, [pattern, replacement]) => 
            acc.replace(pattern, replacement as string), html);
        },
      },
      compression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 10240,
        deleteOriginFile: false
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    server: {
      port: 5173,
      strictPort: true,
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Cross-Origin-Resource-Policy': 'same-origin',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': "camera=(), microphone=(), geolocation=()",
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
      },
      https: isProduction ? {
        key: process.env.HTTPS_KEY,
        cert: process.env.HTTPS_CERT
      } : undefined,
    },
    build: {
      outDir: 'dist',
      sourcemap: isProduction ? false : true,
      minify: 'esbuild',
      target: 'esnext',
      rollupOptions: {
        output: {
          manualChunks: (id: string) => {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'vendor';
            }
            if (id.includes('node_modules/firebase')) {
              return 'firebase';
            }
            if (id.includes('src/lib') || id.includes('src/utils')) {
              return 'utils';
            }
            return null;
          }
        }
      },
      chunkSizeWarningLimit: 1000
    },
    preview: {
      port: 5173,
      strictPort: true,
      headers: getSecurityHeaders(nonce)
    }
  };

  return config;
});