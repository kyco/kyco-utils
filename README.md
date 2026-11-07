# kyco-utils

A set of utilities for TS projects.

## Releasing

Releases use [Changesets](https://github.com/changesets/changesets). Branch flow: `feature/*` → `develop` → `main`.

### With the `prep-release` skill

Run `/prep-release` on your feature branch. It finds the packages that changed since the last release and writes their changesets. Then continue from step 2 below.

### Manually

1. **Add a changeset** on your feature branch for every package that changed:

   ```sh
   pnpm changeset
   ```

   Pick the packages and the bump (patch/minor/major), write a summary, and commit the generated `.changeset/*.md` file. Write the summary in plain English, not Conventional Commits format. It goes straight into the package's CHANGELOG, e.g. "Fix rounding in `formatNumber` for negative values." or "Add `parseNumber` helper."
2. **Open a PR to `develop`**. CI runs lint, typecheck, tests and the build.
3. **Merge it.** The `changeset` workflow then opens (or updates) a `chore: version packages` PR on `develop` that bumps versions and changelogs.
4. **Merge the Version packages PR.**
5. **Open a PR from `develop` to `main` and merge it.** The `release` workflow publishes to npm (`pnpm release`) and creates git tags.

Changes that don't affect a published package (CI, docs, root tooling) don't need a changeset.

## License

[MIT](LICENSE)
