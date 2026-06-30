# Changesets

This folder is managed by [Changesets](https://github.com/changesets/changesets).

When you make a change to a package that should be released, add a changeset:

```bash
pnpm changeset
```

Pick the changed package(s), the bump type (patch / minor / major), and write a short
summary. Commit the generated `.changeset/*.md` file with your PR.

See [`PLAN.md`](../PLAN.md) §6 for the full `develop → main` release flow.
