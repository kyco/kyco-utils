// Placeholder build: copies public/index.html to dist/ so the GitHub Pages workflow
// has something to deploy. Replace this whole app with a real TanStack Start project
// (see ../README.md) and point docs.yml at its real output directory.
import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const dist = join(root, 'dist')

mkdirSync(dist, { recursive: true })
copyFileSync(join(root, 'public', 'index.html'), join(dist, 'index.html'))
// SPA-style fallback so unknown paths still resolve once this is a real router app.
copyFileSync(join(root, 'public', 'index.html'), join(dist, '404.html'))

console.log('Built placeholder docs -> apps/docs/dist')
