import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { randomBytes } from 'crypto';
import { generateCSPString } from './src/lib/csp-config';
import compression from 'vite-plugin-compression';
import type { Connect } from 'vite';
import { IncomingMessage, ServerResponse } from 'http';
import { NextFunction } from 'connect';

// Helper function to set cache headers
function setCacheHeaders(): Connect.HandleFunction {
  return (req: IncomingMessage, res: ServerResponse, next: NextFunction) => {
    const url = req.url || '';
    
    // Set appropriate Cache-Control header based on file type
    if (url.match(/\.(ico|png|svg|jpg|jpeg|gif|webp)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (url.match(/\.(js|css|woff2|woff|ttf)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (url.match(/\.(html)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    } else if (url.includes('googleapis.com') || url.includes('firebaseio.com')) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }

    next();
  };
}

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const nonce = randomBytes(16).toString('base64');

  const config: UserConfig = {
    base: '/',
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      __VUE_PROD_DEVTOOLS__: false,
    },
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
            [/<meta[^>]*Content-Security-Policy[^>]*>/, ''], 
            ['</head>', `<meta http-equiv="Content-Security-Policy" content="${cspString}">\n</head>`]
          ];
          return transforms.reduce((acc, [pattern, replacement]) => 
            acc.replace(pattern, replacement as string), html);
        }
      },
      {
        name: 'cache-control',
        configureServer(server) {
          server.middlewares.use(setCacheHeaders());
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
        '@styles': path.resolve(__dirname, './src/styles')
      }
    },
    server: {
      port: 5173,
      strictPort: true,
      headers: {
        'Content-Security-Policy': generateCSPString(nonce),
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'ALLOW-FROM https://swgoh-tw-guide.firebaseapp.com',
        'Cross-Origin-Resource-Policy': 'same-origin',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': "camera=(), microphone=(), geolocation=()",
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Service-Worker-Allowed': '/',
        'Cache-Control': 'public, max-age=31536000, immutable'
      },
      host: true,
      proxy: {
        '/cookie-policy': {
          target: 'http://localhost:5173',
          changeOrigin: true,
          rewrite: (path) => '/index.html'
        }
      }
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      cssCodeSplit: true,
      cssMinify: true,
      sourcemap: !isProduction,
      minify: isProduction ? 'esbuild' : false,
      target: 'es2020',
      rollupOptions: {
        output: {
          manualChunks: {
            // Core app dependencies
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // Firebase chunks
            'firebase-core': ['firebase/app', 'firebase/auth'],
            'firebase-features': [
              'firebase/firestore', 
              'firebase/storage', 
              'firebase/analytics'
            ],
            // UI related chunks
            'ui-core': ['@radix-ui/react-tabs', 'framer-motion'],
            'ui-icons': ['lucide-react'],
            // Utility libraries
            'utils': ['lodash', 'date-fns']
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            if (!assetInfo?.name) {
              return 'assets/[hash][extname]';
            }
            
            const name = assetInfo.name;
            const ext = name.split('.').pop();
            
            if (ext && /png|jpe?g|svg|gif|tiff|bmp|ico|webp/i.test(ext)) {
              return 'assets/images/[name]-[hash][extname]';
            }
            
            if (ext && /woff2?|eot|ttf|otf/i.test(ext)) {
              return 'assets/fonts/[name]-[hash][extname]';
            }
            
            if (name.endsWith('.css')) {
              return 'assets/css/[name]-[hash][extname]';
            }
            
            return 'assets/[name]-[hash][extname]';
          }
        }
      },
      chunkSizeWarningLimit: 1000
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
      exclude: ['firebase']
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
      }
    }
  };

  return config;
});