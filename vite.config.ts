import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { randomBytes } from 'crypto';
import { generateCSPString } from './src/lib/csp-config';
import compression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const nonce = randomBytes(16).toString('base64');

  const config: UserConfig = {
    base: '/',
    plugins: [
      react(),
      {
        name: 'html-transform',
        transformIndexHtml: (html) => {
          const cspString = generateCSPString(nonce);
          const transforms = [
            [/<script/g, `<script nonce="${nonce}"`],
            [/<style/g, `<style nonce="${nonce}"`],
            [/<link([^>]*?)rel="stylesheet"/g, `<link$1rel="stylesheet" nonce="${nonce}"`],
            ['</head>', `<meta http-equiv="Content-Security-Policy" content="${cspString}">\n</head>`]
          ];
          return transforms.reduce((acc, [pattern, replacement]) => 
            acc.replace(pattern, replacement as string), html);
        }
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
        'Content-Security-Policy': generateCSPString(nonce),
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Cross-Origin-Resource-Policy': 'same-origin',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Permissions-Policy': "camera=(), microphone=(), geolocation=()",
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
      },
      host: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: !isProduction,
      minify: isProduction ? 'esbuild' : false,
      target: 'es2020',
      assetsDir: 'assets',
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            ui: ['@radix-ui/react-tabs', 'framer-motion', 'lucide-react']
          },
          assetFileNames: (assetInfo) => {
            const name = assetInfo?.name;
            if (!name) {
              return 'assets/[hash][extname]';
            }
            const ext = name.split('.').pop();
            if (ext && /png|jpe?g|svg|gif|tiff|bmp|ico|webp/i.test(ext)) {
              return 'assets/images/[name]-[hash][extname]';
            }
            if (ext && /woff2?|eot|ttf|otf/i.test(ext)) {
              return 'assets/fonts/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    optimizeDeps: {
      include: ['react', 'react-dom']
    },
    preview: {
      port: 5173,
      strictPort: true,
      headers: {
        'Content-Security-Policy': generateCSPString(nonce),
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Cross-Origin-Resource-Policy': 'same-origin',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Permissions-Policy': "camera=(), microphone=(), geolocation=()",
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
      },
    }
  };

  return config;
});