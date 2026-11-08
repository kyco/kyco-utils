import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig, type Plugin } from 'vitepress'

import apiSidebar from '../api/typedoc-sidebar.json' with { type: 'json' }

const docsDir = fileURLToPath(new URL('../../', import.meta.url))
const packagesDir = fileURLToPath(new URL('../../../../packages/', import.meta.url))
const apiDir = fileURLToPath(new URL('../api', import.meta.url))

/**
 * Make `to` match `from`, writing only files whose content changed.
 */
const syncDir = (from: string, to: string) => {
  const files = (dir: string) =>
    existsSync(dir) ? readdirSync(dir, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()) : []
  const rel = (dir: string) => new Set(files(dir).map((e) => relative(dir, join(e.parentPath, e.name))))
  const next = rel(from)

  for (const file of next) {
    const content = readFileSync(join(from, file))
    const target = join(to, file)
    if (existsSync(target) && readFileSync(target).equals(content)) continue
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, content)
  }
  for (const file of rel(to)) if (!next.has(file)) rmSync(join(to, file))
}

/**
 * Dev only: re-run TypeDoc when package sources change (its `--watch` doesn't support the `packages` strategy).
 */
const typedocWatch = (): Plugin => ({
  name: 'kyco-utils:typedoc-watch',
  apply: 'serve',
  configureServer(server) {
    const srcDirs = readdirSync(packagesDir)
      .map((name) => `${packagesDir}${name}/src`)
      .filter((dir) => existsSync(dir))
    server.watcher.add(srcDirs)

    let timer: ReturnType<typeof setTimeout> | undefined
    let running = false
    let queued = false

    const run = () => {
      if (running) {
        queued = true
        return
      }
      running = true
      // Generate into a temp dir (same `api/` path relative to docsRoot, so links match), then copy only changed
      // files: rewriting an unchanged `typedoc-sidebar.json` would restart VitePress and briefly 404 the open page.
      const tmp = mkdtempSync(join(tmpdir(), 'kyco-typedoc-'))
      const args = ['--out', join(tmp, 'api'), '--docsRoot', tmp]
      spawn(`${docsDir}node_modules/.bin/typedoc`, args, { cwd: docsDir, stdio: 'inherit' }).on('close', (code) => {
        if (code === 0) syncDir(join(tmp, 'api'), apiDir)
        rmSync(tmp, { recursive: true, force: true })
        running = false
        if (queued) {
          queued = false
          run()
        }
      })
    }

    const onChange = (file: string) => {
      if (!srcDirs.some((dir) => file.startsWith(dir)) || file.endsWith('.test.ts')) return
      clearTimeout(timer)
      timer = setTimeout(run, 200)
    }
    server.watcher.on('add', onChange).on('change', onChange).on('unlink', onChange)
  },
})

export default defineConfig({
  vite: { plugins: [typedocWatch()] },
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
