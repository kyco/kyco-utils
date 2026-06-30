import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  // Keep workspace packages as external imports in the build + .d.ts
  // (they resolve via the consumer's installed @kyco-utils/* packages).
  external: ['@kyco-utils/enums', '@kyco-utils/types'],
})
