import path from 'path'

import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import type { HtmlTagDescriptor, Plugin } from 'vite'
import { defineConfig } from 'vite'

const DEV_API_URL = 'http://localhost:8000'

const FIRST_PAINT_FONT_NAMES = [
  'inter-latin-wght-normal',
  'source-serif-4-latin-opsz-normal',
]

function getFontPreloadTag(
  fileNames: string[],
  fontName: string
): HtmlTagDescriptor {
  const fileName = fileNames.find(
    (name) => name.startsWith(`assets/${fontName}-`) && name.endsWith('.woff2')
  )
  if (fileName === undefined)
    throw new Error(`The build has no font file named ${fontName}`)
  return {
    tag: 'link',
    attrs: {
      rel: 'preload',
      href: `/${fileName}`,
      as: 'font',
      type: 'font/woff2',
      crossorigin: true,
    },
    injectTo: 'head',
  }
}

function preloadFirstPaintFonts(): Plugin {
  return {
    name: 'preload-first-paint-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: (_html, { bundle }) => {
        const fileNames = Object.keys(bundle ?? {})
        return FIRST_PAINT_FONT_NAMES.map((fontName) =>
          getFontPreloadTag(fileNames, fontName)
        )
      },
    },
  }
}

export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    viteReact(),
    tailwindcss(),
    preloadFirstPaintFonts(),
  ],
  // The embed page is HTML the API renders, served at /embed on the live site.
  server: {
    proxy: { '/embed': DEV_API_URL },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
