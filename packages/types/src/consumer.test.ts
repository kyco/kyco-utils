import { createRequire } from 'node:module'

import * as esm from '@kyco-utils/types'
import { describe, expect, it } from 'vite-plus/test'

// Packaging smoke test for a types-only package: it must resolve to the built `dist/`
// and ship no runtime exports.
const require = createRequire(import.meta.url)
const cjs = require('@kyco-utils/types') as typeof esm

describe('+ @kyco-utils/types (consumer)', () => {
  it('should resolve to the built dist', () => {
    expect(require.resolve('@kyco-utils/types')).toMatch(/[\\/]dist[\\/]index\.cjs$/)
    expect(import.meta.resolve('@kyco-utils/types')).toMatch(/\/dist\/index\.mjs$/)
  })

  describe.each([
    ['ESM', esm],
    ['CJS', cjs],
  ])('- %s', (_, mod) => {
    it('should expose no runtime exports', () => {
      expect(Object.keys(mod)).toEqual([])
    })
  })
})
