# @kyco-utils/docs

Docs site built with [VitePress](https://vitepress.dev). API reference is generated from TSDoc comments by [TypeDoc](https://typedoc.org) into `src/api/` (gitignored).

```sh
pnpm --filter @kyco-utils/docs dev      # generate API + dev server
pnpm --filter @kyco-utils/docs build    # build to dist/
pnpm --filter @kyco-utils/docs preview  # serve built dist/
```

Deployed to GitHub Pages by `.github/workflows/docs.yml`.
