---

name: prep-release
description: Find package changes since the last kyco-utils release and create the matching changesets.
---

# Prep release

Find what changed since the last release and write changesets for it. Steps:

1. **Find each package's last release.** Run `git fetch origin --tags` first. For each package in `packages/`, its last release is its latest tag: `git tag --list '@kyco-utils/<pkg>@*' --sort=-v:refname | head -1`. A package with no tag has never been released.
2. **Find changed packages.** For each package, `git diff --stat <last-tag>..HEAD -- packages/<pkg>`. Ignore `apps/docs` (it's in the changeset ignore list) and changes outside `packages/`.
3. **Check for existing changesets.** `ls .changeset/*.md`, excluding README.md. Don't duplicate them.
4. **Propose bumps** for each changed package, based on `git diff <last-tag>..HEAD -- packages/<pkg>`:
   - patch: fixes, refactors, internal changes
   - minor: new exports or features, new lint rules in biome-config
   - major: breaking API changes
     Show the proposal as a table, then wait for confirmation:

   | Package             | Bump  | Current | New   | Changeset summary                    |
   | ------------------- | ----- | ------- | ----- | ------------------------------------ |
   | `@kyco-utils/<pkg>` | patch | 0.1.1   | 0.1.2 | • Exact wording of each summary line |

   Take the current version from the package's last tag. Use one bullet per summary line, separated with `<br>`. Mention any packages you skipped and why below the table.
5. **Write changesets** as `.changeset/<kebab-name>.md` (`pnpm changeset` is interactive, so write the file directly):

   ```md
   ---
   "@kyco-utils/<pkg>": patch
   ---

   Short user-facing summary.
   ```

   Write the summary in plain English, not Conventional Commits (no `fix:` prefix). It goes straight into the CHANGELOG. Keep it short and precise: name what changed and skip the reasons and background. Good: "Fix `formatNumber` rounding for negatives." Too long: "Use a clearer sample number when detecting locale number separators."

6. **Commit.** Ask whether to commit the changesets. Once confirmed, stage only the new `.changeset/*.md` files and commit them with the message `chore: changeset`.
