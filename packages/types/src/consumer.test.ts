import * as mod from '@kyco-utils/types'
import { describe, expect, it } from 'vite-plus/test'

// Packaging smoke test for a types-only package: it must resolve to the built `dist/`
// and ship no runtime exports.
describe('+ @kyco-utils/types (consumer)', () => {
  it('should resolve to the built dist', () => {
    expect(import.meta.resolve('@kyco-utils/types')).toMatch(/\/dist\/index\.mjs$/)
  })

  it('should expose no runtime exports', () => {
    expect(Object.keys(mod)).toEqual([])
  })
})
