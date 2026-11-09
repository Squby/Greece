
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/greek-trainer/',

  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: 'autoUpdate',

      includeAssets: ['favicon.svg'],

      manifest: {
        id: '/greek-trainer/',
        name: 'Ελληνικά — тренажёр греческого',
        short_name: 'Ελληνικά',
        description: 'Учим греческие слова и грамматику',

        start_url: '/greek-trainer/',
        scope: '/greek-trainer/',

        theme_color: '#0d3b66',
        background_color: '#f7f9fb',
        display: 'standalone',
        lang: 'ru',

        icons: [
          {
            src: '/greek-trainer/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/greek-trainer/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
