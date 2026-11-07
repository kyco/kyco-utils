import { defineConfig } from 'vitepress'

import apiSidebar from '../api/typedoc-sidebar.json' with { type: 'json' }

export default defineConfig({
  title: '@kyco-utils',
  description: 'Shared TypeScript utilities.',
  base: '/kyco-utils/',
  outDir: '../dist',
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
    ],
    sidebar: {
      '/guide/': [{ text: 'Guide', items: [{ text: 'Getting started', link: '/guide/getting-started' }] }],
      '/api/': [{ text: 'API reference', items: apiSidebar }],
    },
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/kyco/kyco-utils' }],
  },
})
