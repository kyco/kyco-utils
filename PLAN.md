# kyco-kyco-utils — Build Plan

A pnpm monorepo of small, independently-versioned TypeScript packages published to the
`@kyco-utils` npm scope, plus a TanStack Start docs site on GitHub Pages. Each package
publishes to npm **only when it actually changes**.

---

## 1. Decisions (locked)

| Area                 | Choice                                             | Why                                                                   |
|----------------------|----------------------------------------------------|-----------------------------------------------------------------------|
| Package manager      | **pnpm** workspaces                                | Fast, strict, first-class monorepo support                            |
| Versioning / publish | **Changesets**                                     | Publishes *only changed* packages; per-package (independent) versions |
| Build / bundler      | **tsup** (esbuild)                                 | Dual **ESM + CJS** output + `.d.ts` in one step                       |
| Module format        | **ESM + CJS dual**                                 | Works in modern and legacy CJS consumers                              |
| Lint + format        | **Biome**                                          | One fast tool, replaces ESLint + Prettier                             |
| Tests                | **Vitest**                                         | Fast, TS-native, Vite-aligned with the docs app                       |
| Docs                 | **TanStack Start**, prerendered → **GitHub Pages** | As requested (see §8 for the base-path caveat)                        |
| Node / pnpm          | Node 22 LTS, pnpm 9 (pinned via `packageManager`)  | Reproducible CI                                                       |

No Nx and no Turborepo for now — with three packages, pnpm's topological `-r` runs and
Changesets cover everything. Turborepo can be added later purely for build caching without
changing any of the below.

---

## 2. Repository layout

```
kyco-kyco-utils/
├── apps/
│   └── docs/                     # @kyco-utils/docs (private) — TanStack Start
├── packages/
│   ├── types/                    # @kyco-utils/types   — pure types, zero deps
│   ├── enums/                    # @kyco-utils/enums   — runtime enums + zod schemas
│   └── number/                   # @kyco-utils/number  — functions
├── .changeset/
│   └── config.json
├── .github/workflows/
│   ├── ci.yml                    # lint · typecheck · test · build on every PR
│   ├── release.yml               # Changesets → publish changed packages to npm
│   └── docs.yml                  # build docs → deploy to GitHub Pages
├── biome.json
├── tsconfig.base.json
├── pnpm-workspace.yaml
├── package.json                  # root, "private": true
├── .npmrc
├── .nvmrc                        # 22
├── LICENSE
└── README.md
```

---

## 3. Packages & dependency graph

**Fix to the starter code:** in your draft, `UserLocale` is defined in `enums` but the
consumer imports it from `@kyco-utils/types`. Pick one owner. Recommended ownership:

```
types   →  (no deps)            NumberSeparators, and other pure structural types
enums   →  zod (peer + dev)     UserLocale (value), zUserLocale, type UserLocale
number  →  types, enums         getNumberSeparators(...)
```

So the graph is `number → { types, enums }`, `enums → zod`, `types → ∅`. No cycles.
Because `number` only uses `UserLocale` / `NumberSeparators` as **types** (not runtime
values), those two could even be `peerDependencies` to keep installs lean — but plain
`dependencies` via the `workspace:^` protocol is simpler and correct, so start there.

### Corrected package source

```ts
// packages/types/src/index.ts
export type NumberSeparators = {
  thousandsSeparator: string
  decimalSeparator: string
}
```

```ts
// packages/enums/src/index.ts
import { z } from 'zod'

export const UserLocale = {
  EN_GB: 'en-GB',
  DE_DE: 'de-DE',
} as const

// Zod 4: z.enum() accepts an object literal. (z.nativeEnum is deprecated in v4.)
export const zUserLocale = z.enum(UserLocale)
export type UserLocale = z.infer<typeof zUserLocale>
```

```ts
// packages/number/src/index.ts
import type { UserLocale } from '@kyco-utils/enums'
import type { NumberSeparators } from '@kyco-utils/types'

export const getNumberSeparators = (locale: UserLocale): NumberSeparators => {
  const parts = new Intl.NumberFormat(locale).formatToParts(11111.1)
  const thousandsSeparator = parts.find((p) => p.type === 'group')?.value ?? ','
  const decimalSeparator = parts.find((p) => p.type === 'decimal')?.value ?? '.'
  return { thousandsSeparator, decimalSeparator }
}
```

### Corrected consumer usage

```ts
import { UserLocale } from '@kyco-utils/enums'        // value lives in enums, not types
import { getNumberSeparators } from '@kyco-utils/number'

console.log('Supported locales:', Object.values(UserLocale))
console.log(`Separators for ${UserLocale.DE_DE}:`, getNumberSeparators(UserLocale.DE_DE))
```

---

## 4. Package configuration (publishing)

Every publishable package uses the same shape. Example for `number`:

```jsonc
// packages/number/package.json
{
  "name": "@kyco-utils/number",
  "version": "0.0.0",                 // Changesets owns this from here on
  "type": "module",
  "sideEffects": false,
  "license": "MIT",
  "files": ["dist"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",     // ESM
      "require": "./dist/index.cjs"    // CJS
    }
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "dependencies": {
    "@kyco-utils/types": "workspace:^",
    "@kyco-utils/enums": "workspace:^"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "lint": "biome check ."
  },
  "publishConfig": { "access": "public", "provenance": true }
}
```

Notes:
- `workspace:^` is rewritten to a real semver range (e.g. `^1.2.0`) automatically on publish.
- `publishConfig.access: "public"` is required — scoped packages default to private.
- `enums` adds `"peerDependencies": { "zod": "^4.0.0" }` plus zod as a devDependency. Keeping
  zod a peer means consumers share one zod instance.

**tsup config** (identical per package):

```ts
// tsup.config.ts
import { defineConfig } from 'tsup'
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
})
```

**TypeScript**: one `tsconfig.base.json` at the root (strict, `target` ES2022, `module`
ESNext, `moduleResolution` "Bundler", `declaration` true, `verbatimModuleSyntax` true). Each
package has a tiny `tsconfig.json` that extends it and sets `include: ["src"]`. tsup handles
emit; `tsc --noEmit` is only for typechecking. pnpm builds in dependency order automatically,
so `types`/`enums` are built before `number`.

---

## 5. Shared tooling

- **biome.json** at the root with a `lint` + `format` config; run `biome check --write .`
  locally and `biome ci .` in CI.
- **Vitest** per package (`*.test.ts` next to source). A root `vitest.config.ts` can define
  workspace projects so `pnpm test` runs everything.
- **Root `package.json` scripts** fan out with pnpm:

```jsonc
{
  "private": true,
  "packageManager": "pnpm@9.x",
  "scripts": {
    "build": "pnpm -r --filter='./packages/*' build",
    "test": "pnpm -r test",
    "lint": "biome check .",
    "typecheck": "pnpm -r typecheck",
    "changeset": "changeset",
    "version-packages": "changeset version",
    "release": "pnpm build && changeset publish"
  }
}
```

`pnpm-workspace.yaml`:

```yaml
packages:
  - "packages/*"
  - "apps/*"
```

---

## 6. Versioning & publishing (Changesets) — "only changed packages publish"

```jsonc
// .changeset/config.json
{
  "$schema": "https://unpkg.com/@changesets/config/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "access": "public",
  "baseBranch": "develop",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

The docs app is `"private": true`, so Changesets ignores it automatically — it never
publishes to npm. Independent (per-package) versioning is the default; no `fixed`/`linked`
groups, so each package carries its own version.

**Why this gives you exactly what you asked for:** add a new enum → you run
`pnpm changeset`, tick **only** `@kyco-utils/enums`, choose a bump. On merge, only `enums`
gets a new version and is published. `number` and `types` are untouched (unless they depend
on `enums` and `updateInternalDependencies` gives them a patch bump).

**Branch flow & developer workflow** (`develop` → `main`)

1. Branch off `develop`, make changes.
2. `pnpm changeset` → select changed packages + bump type (patch/minor/major) + a one-line
   summary. Commit the generated `.changeset/*.md`.
3. PR into `develop` → CI runs (lint/typecheck/test/build). Merge.
4. Each push to `develop` updates a standing **"Version Packages" PR** (against `develop`)
   that applies all pending changesets: bumps versions, writes CHANGELOGs, deletes the
   changeset files. It just sits there accumulating until you want to release.
5. **To cut a release:** merge the Version Packages PR into `develop` (versions are now
   bumped on `develop`), then merge **`develop` → `main`**.
6. The push to `main` runs **`release.yml`** (`changeset publish` → publishes only packages
   whose version isn't yet on npm) and **`docs.yml`** (rebuild + deploy Pages).

Because every version mutation happens on `develop` and reaches `main` only through the
merge, the two branches never drift. Order matters: merge the Version PR into `develop`
*before* merging `develop → main`, otherwise `main` receives the changesets unconsumed and
`release.yml` simply no-ops (nothing new to publish) until you do.

> Prefer zero intermediate PRs? You could instead auto-run `changeset version` on `main` and
> publish in one shot — but that commits version bumps onto `main` that you then have to sync
> back to `develop`. The Version-PR-on-`develop` flow above avoids that drift.

---

## 7. CI/CD (GitHub Actions) — tuned for `develop` → `main`

Four workflows. Code and version bumps accumulate on **`develop`**; pushing to **`main`**
(i.e. merging `develop → main`) is what publishes packages and deploys the docs.

**`ci.yml`** — on PRs into `develop`/`main` and pushes to them
(`on: { pull_request: { branches: [develop, main] }, push: { branches: [develop, main] } }`):
checkout → setup pnpm + Node 22 (pnpm cache) → `pnpm install --frozen-lockfile` →
`biome ci .` → `pnpm typecheck` → `pnpm test` → `pnpm build`.

**`version.yml`** — on push to `develop`. Maintains the **"Version Packages" PR** against
`develop`; it never publishes:

```yaml
name: version
on:
  push: { branches: [develop] }
concurrency: version-${{ github.ref }}
permissions:
  contents: write          # commit version bumps to the PR branch
  pull-requests: write     # open/update the Version Packages PR
jobs:
  version:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - uses: changesets/action@v1
        with:
          version: pnpm changeset version       # bump versions + changelogs on the PR
          title: "chore: version packages"
          commit: "chore: version packages"
          branch: changeset-release/develop     # head branch of the PR
          # no `publish` → this workflow only manages the PR, never releases
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**`release.yml`** — on push to `main`. Publishes only the packages whose version isn't on
npm yet (the bumps already happened on `develop`):

```yaml
name: release
on:
  push: { branches: [main] }
concurrency: release-${{ github.ref }}
permissions:
  contents: write     # push git tags + GitHub releases
  id-token: write     # npm provenance
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }              # full history so tags resolve
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm, registry-url: 'https://registry.npmjs.org' }
      - run: pnpm install --frozen-lockfile
      - uses: changesets/action@v1
        with:
          publish: pnpm release       # = pnpm build && changeset publish
          # no `version` → on main we only publish; bumps happened on develop
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          NPM_CONFIG_PROVENANCE: true
```

Setup needed once:
- Create an **npm automation token** in the `kyco-utils` org → add as repo secret `NPM_TOKEN`.
- `.npmrc` (committed): `//registry.npmjs.org/:_authToken=${NPM_TOKEN}` — or rely on
  `setup-node`'s `registry-url` + the env token as above.
- Provenance (`id-token: write` + `NPM_CONFIG_PROVENANCE`) is optional but recommended; it
  adds a verifiable build attestation to each release.

**`docs.yml`** — also on push to `main`, so the same `develop → main` merge that releases
packages refreshes the docs:

```yaml
name: docs
on:
  push: { branches: [main] }   # add `paths: ['apps/docs/**','packages/**']` to skip no-op rebuilds
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  deploy:
    environment: github-pages
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @kyco-utils/docs build      # prerenders to static output
      - uses: actions/upload-pages-artifact@v3
        with: { path: apps/docs/dist }                 # confirm Start's output dir
      - uses: actions/deploy-pages@v4
```

---

## 8. Docs app — TanStack Start → GitHub Pages (read this)

GitHub Pages serves **static files only**, so the docs app must be **prerendered**, not
SSR'd. TanStack Start supports this two ways:

- **SPA mode** — ships a static `_shell.html` and rewrites 404s to it (client-side routing).
- **Static prerendering (SSG)** — crawls and emits real HTML per route (better for docs SEO
  and deep links). Configure via the `prerender` option in the `tanstackStart` plugin.

**The caveat:** a GitHub Pages *project* site is served from a subpath
(`https://<user>.github.io/kyco-kyco-utils/`), which forces a non-default Vite `base`. There is
a **known TanStack issue where a non-default `base` breaks SPA-mode prerender**
([router #5261](https://github.com/TanStack/router/issues/5261)), and a related one where SPA
prerender only emits the root route ([#4798](https://github.com/TanStack/router/issues/4798)).

**Recommended path (avoids the bug entirely):** use a **custom domain** (a `CNAME` file in
the Pages artifact, e.g. `utils.kyco.dev`) so `base` stays `/`. Then prefer **full static
prerendering** of all routes, with a `404.html` fallback copy of the shell for client routing.
If you don't want a custom domain, set `base: '/kyco-kyco-utils/'`, use full SSG (not SPA shell),
and **test the build against the current TanStack Start version** before relying on it — pin
the version once it works.

Pages source = "GitHub Actions" (set in repo Settings → Pages).

---

## 9. Open decisions & risks

1. **Zod major version** — `z.enum(object)` requires **Zod 4**. On Zod 3 you'd use
   `z.nativeEnum(UserLocale)`. Decide the supported peer range (`^4.0.0` recommended).
2. **GitHub Pages base path** — custom domain (clean) vs. `/kyco-kyco-utils/` subpath (must
   verify the prerender bug above). This is the biggest docs unknown.
3. **First publish** — packages start at `0.0.0`; the first changeset sets real versions. If
   you want them to launch at `1.0.0` as in your example, the first changeset should be a
   major (or just hand-set the initial versions before the first release).
4. **`number` cross-deps as peers vs deps** — type-only today; `dependencies` is the safe
   default, switch to `peerDependencies` later if install size matters.
5. **Repo vs scope name** — repo is `kyco-kyco-utils`, npm scope is `@kyco-utils`. Fine, just
   keep it intentional.

---

## 10. Phased build order

1. **Scaffold root** — `package.json` (private, `packageManager`), `pnpm-workspace.yaml`,
   `tsconfig.base.json`, `biome.json`, `.npmrc`, `.nvmrc`, init Changesets (`pnpm dlx
   @changesets/cli init`).
2. **`types`** — package.json + `src/index.ts` + tsup + tsconfig; build green.
3. **`enums`** — add zod (peer + dev), implement, test `zUserLocale` parses both locales.
4. **`number`** — wire `workspace:^` deps, implement, add a Vitest test for
   `getNumberSeparators('de-DE')` → `{ thousandsSeparator: '.', decimalSeparator: ',' }`.
5. **CI** — add `ci.yml`; confirm lint/typecheck/test/build pass on a PR.
6. **Release pipeline** — `release.yml` + `NPM_TOKEN`; do a first manual changeset and ship
   `1.0.0`s; verify only intended packages publish.
7. **Docs app** — TanStack Start in `apps/docs`, prerender config, `docs.yml`, settle the
   base-path/custom-domain decision, first deploy.
8. **Consumer smoke test** — install the three packages in a throwaway project and run your
   example snippet.

---

### Sources
- Zod 4 enum API: [Zod migration guide](https://zod.dev/v4/changelog), [Defining schemas](https://zod.dev/api)
- TanStack Start static deploy: [SPA mode](https://tanstack.com/start/v0/docs/framework/react/guide/spa-mode), [Static prerendering](https://tanstack.com/start/latest/docs/framework/react/guide/static-prerendering), [base-path issue #5261](https://github.com/TanStack/router/issues/5261), [#4798](https://github.com/TanStack/router/issues/4798)

---

## Appendix — original brief

> Preserved verbatim for reference (also in git history).

```
I want to create a monorepo here which I can use across projects.
The folder strucuture should have:

- apps/docs
- packages/enums
- pacakges/types
- packages/number

I have some very basic starter code below for the packages. the docs app should be a
very basic tanstack start project where i can create docs and perhaps post them to
github pages or cloudflare.

(packages pseudo-code: getNumberSeparators in packages/number; NumberSeparators in
packages/types; UserLocale + zUserLocale in packages/enums)

Consumers depend on @kyco-utils/number, @kyco-utils/enums, @kyco-utils/types and import
UserLocale + getNumberSeparators.

These packages could see a lot of changes over time so the github actions should only
publish packages that change. e.g. if I add a new enum then only the "enums" package
should publish a new version to npm. npm org kyco-utils already exists.

Use exclusively pnpm. Open to nx if it makes deployment easier.
```
