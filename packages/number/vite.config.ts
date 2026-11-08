import { defineConfig } from 'vite-plus'

export default defineConfig({
  pack: {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true,
    // Keep workspace packages as external imports in the build + .d.ts
    // (they resolve via the consumer's installed @kyco-utils/* packages).
    deps: {
      neverBundle: ['@kyco-utils/enums', '@kyco-utils/types'],
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
  run: {
    tasks: {
      // `src/consumer.test.ts` imports this package by name, i.e. the built `dist/` — so build (and deps) first.
      test: {
        command: 'vp test run',
        dependsOn: ['build', { task: 'build', from: 'dependencies' }],
      },
    },
  },
})
