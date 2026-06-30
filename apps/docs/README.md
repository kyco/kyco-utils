# @kyco-utils/docs

Documentation site. **This is currently a placeholder** — a tiny static-page build so the
GitHub Pages workflow (`.github/workflows/docs.yml`) is wired up and deploys end to end.
Replace it with a real [TanStack Start](https://tanstack.com/start) app.

This package is `private`, so Changesets never publishes it to npm.

## Replacing the placeholder

1. Scaffold a TanStack Start app in this folder (keep the package name `@kyco-utils/docs`
   and `"private": true`). Use the current official initializer, e.g.
   `pnpm create @tanstack/start@latest`.
2. Delete `scripts/build-placeholder.mjs` and `public/index.html`.
3. Configure **static prerendering** (GitHub Pages serves static files only) and update
   `docs.yml`'s `upload-pages-artifact` `path:` to the app's real output directory.

## The base-path decision (read PLAN.md §8)

A GitHub Pages *project* site is served from a subpath
(`https://<user>.github.io/kyco-kyco-utils/`), which forces a non-default Vite `base`. There
is a known TanStack issue where a non-default `base` breaks SPA-mode prerender
([router #5261](https://github.com/TanStack/router/issues/5261)).

Recommended: use a **custom domain** (add a `CNAME` file to the deployed artifact) so `base`
stays `/`, and prefer **full static prerendering** of all routes. Otherwise set
`base: '/kyco-kyco-utils/'`, use full SSG (not SPA shell), and verify the build against the
TanStack Start version you pin.
