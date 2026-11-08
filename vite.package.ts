import { defineConfig } from 'vite-plus'

type Options = {
  /** Workspace packages to keep as external imports in the build + .d.ts (resolved via the consumer's install). */
  neverBundle?: string[]
}

/**
 * Shared `vite.config.ts` for every published package in `packages/*`.
 */
export const definePackageConfig = ({ neverBundle = [] }: Options = {}) =>
  defineConfig({
    pack: {
      entry: ['src/index.ts'],
      format: ['esm'],
      dts: true,
      clean: true,
      sourcemap: true,
      treeshake: true,
      deps: { neverBundle },
    },
    test: {
      include: ['src/**/*.test.ts'],
    },
    run: {
      tasks: {
        // `src/consumer.test.ts` imports the package by name, i.e. the built `dist/` — so build (and deps) first.
        test: {
          command: 'vp test run',
          dependsOn: ['build', { task: 'build', from: 'dependencies' }],
        },
      },
    },
  })
