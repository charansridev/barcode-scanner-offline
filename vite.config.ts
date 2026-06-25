import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-192x192.svg', 'pwa-512x512.svg'],
      manifest: {
        name: 'ScanVault — Product Scanner',
        short_name: 'ScanVault',
        description: 'Product scanner app — capture, label, and track inventory items with ease.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Precaching all local build assets is handled automatically by VitePWA.
        // The following runtime caching rules ensure the external Tesseract.js
        // worker scripts, core WASM files, and traineddata files are cached
        // when first loaded, allowing complete offline functionality thereafter.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/.*\.js/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tesseract-scripts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/@tesseract\.js-data\/.*\.gz/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tesseract-data',
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/tessdata\.projectnaptha\.com\/.*\.gz/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tesseract-naptha-data',
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
})
