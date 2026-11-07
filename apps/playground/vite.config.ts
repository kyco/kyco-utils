import { existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { defaultClientConditions, defineConfig, type Plugin } from 'vite-plus'

const SOURCE_CONDITION = '@kyco-utils/source'

/**
 * Workspace packages that are config-only and don't need a playground page.
 */
const NO_PAGE = new Set(['biome-config'])

/**
 * On startup, warn if packages/* and src/pages/* are out of sync.
 */
const checkPages = (): Plugin => ({
  name: 'kyco-utils:check-pages',
  apply: 'serve',
  configResolved(config) {
    const packagesDir = fileURLToPath(new URL('../../packages', import.meta.url))
    const pagesDir = fileURLToPath(new URL('./src/pages', import.meta.url))
    const packages = readdirSync(packagesDir).filter(
      (d) => existsSync(`${packagesDir}/${d}/package.json`) && !NO_PAGE.has(d),
    )
    const pages = readdirSync(pagesDir)
      .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
      .map((f) => f.slice(0, -3))

    const missing = packages.filter((p) => !pages.includes(p))
    const stale = pages.filter((p) => !packages.includes(p))
    if (missing.length)
      config.logger.warn(
        `[playground] No page for: ${missing.join(', ')} → add src/pages/<name>.ts + src/pages/index.ts`,
      )
    if (stale.length) config.logger.warn(`[playground] Page without package: ${stale.join(', ')} → remove it`)
  },
})

/**
 * `vp dev`             → resolves @kyco-utils/* from package sources (HMR across packages, no build).
 * `vp dev --mode dist` → resolves the built `dist/` output, exactly what npm consumers get.
 */
export default defineConfig(({ mode }) => {
  const fromSource = mode !== 'dist' && mode !== 'production'

  return {
    plugins: [checkPages()],
    resolve: {
      conditions: fromSource ? [SOURCE_CONDITION, ...defaultClientConditions] : [...defaultClientConditions],
    },
    run: {
      tasks: {
        // tsconfig resolves @kyco-utils/* from the built `dist/` (no source condition), so build deps first.
        typecheck: {
          command: 'tsc --noEmit',
          dependsOn: [{ task: 'build', from: 'dependencies' }],
        },
      },
    },
  }
})
