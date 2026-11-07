import { defineConfig } from 'vite-plus'

export default defineConfig({
  pack: {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true,
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
