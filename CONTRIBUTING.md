# Contributing

## Setup

Requires Node (see [.nvmrc](.nvmrc)) and pnpm.

```sh
pnpm install
```

## Repo layout

- `packages/*`: published packages.
- `apps/docs`: docs site (VitePress + TypeDoc), deployed to GitHub Pages. See its [README](apps/docs/README.md).
- `apps/playground`: local app that consumes the packages like an external project would.

## Scripts

```sh
pnpm build       # build all packages
pnpm dev         # build in watch mode
pnpm test        # run tests (builds first)
pnpm typecheck
pnpm lint        # pnpm lint:fix to auto-fix
```

## Releasing

Releases use [Changesets](https://github.com/changesets/changesets).

Branch flow: `feature/*` → `develop` → `main`.

Run the `/prep-release` skill on your feature branch. It writes the changesets, commits them and opens a PR to `develop` (steps 1–2). Then continue from step 3.

To do it manually:

1. **Add a changeset** on your feature branch for every package that changed:

   ```sh
   pnpm changeset
   ```

   - Pick the packages and the bump (patch/minor/major), write a summary, and commit the generated `.changeset/*.md` file.
   - Write the summary in plain English, not Conventional Commits format. The summary goes straight into the package's CHANGELOG. Keep it short: name what changed, skip the reasons, e.g. "Fix `formatNumber` rounding for negatives." or "Add `parseNumber` helper."

2. **Open a PR to `develop`.** CI runs lint, typecheck, build and tests.

3. **Merge the PR.** The `changeset` workflow opens (or updates) a `chore: version packages` PR on `develop` that bumps versions and changelogs.

4. **Merge the version packages PR.** The `changeset` workflow then opens a `chore: release` PR from `develop` to `main`.

5. **Merge the release PR.** The `release` workflow builds, tests and publishes to npm (Trusted Publishing), creates git tags and GitHub releases, then syncs `main` back into `develop`.

Changes that don't affect a published package (CI, docs, apps, root tooling) don't need a changeset.
