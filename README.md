# kyco-ts-utils

A pnpm monorepo of small, independently-versioned TypeScript utilities published to the
[`@kyco-utils`](https://www.npmjs.com/org/kyco-utils) npm scope, plus a docs site.

## Packages

| Package                                 | Description                              |
|-----------------------------------------|------------------------------------------|
| [`@kyco-utils/types`](packages/types)   | Shared, dependency-free TypeScript types |
| [`@kyco-utils/enums`](packages/enums)   | Runtime enums + Zod schemas              |
| [`@kyco-utils/number`](packages/number) | Locale-aware number utilities            |

Each package ships dual **ESM + CJS** builds with type declarations, and is published to npm
**only when it changes** (via [Changesets](https://github.com/changesets/changesets)).

## Usage (consumers)

```jsonc
// package.json
"dependencies": {
  "@kyco-utils/number": "^1.0.0",
  "@kyco-utils/enums": "^1.0.0",
  "@kyco-utils/types": "^1.0.0"
}
```

```ts
import { UserLocale } from '@kyco-utils/enums'
import { getNumberSeparators } from '@kyco-utils/number'

console.log('Supported locales:', Object.values(UserLocale))
console.log(`Separators for ${UserLocale.DE_DE}:`, getNumberSeparators(UserLocale.DE_DE))
```

> `@kyco-utils/enums` lists `zod` as a peer dependency — install `zod@^4` alongside it.

## Development

```bash
pnpm install        # install + generate pnpm-lock.yaml (commit it)
pnpm build          # build all packages (ESM + CJS + d.ts)
pnpm test           # run Vitest across packages
pnpm typecheck      # tsc --noEmit across packages
pnpm lint           # Biome
pnpm format         # Biome --write
```

This repo is **pnpm-only** (enforced by a `preinstall` hook). Requires Node `>=22`.

## Releasing

Work on `develop`; merge to `main` to publish. The short version:

1. Add a changeset with your change: `pnpm changeset`.
2. Merge feature PRs into `develop`. A **"Version Packages"** PR is kept up to date there.
3. Merge that PR into `develop`, then merge `develop → main`.
4. Pushing to `main` publishes the changed packages and deploys the docs.

Full details and the rationale are in [`PLAN.md`](PLAN.md).

## License

[MIT](LICENSE)
