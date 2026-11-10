# kyco-utils

Small, tree-shakeable TypeScript utilities. Install only the packages you need.

📖 **[Documentation & API reference](https://kyco.github.io/kyco-utils)**

## Packages

All packages are ESM only.

| Package                                             | Description                                                        | Version                                                                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| [`@kyco-utils/search`](packages/search)             | Case- and accent-insensitive search with highlighting.             | [![npm](https://img.shields.io/npm/v/@kyco-utils/search)](https://www.npmjs.com/package/@kyco-utils/search)             |
| [`@kyco-utils/number`](packages/number)             | Locale-aware number utilities.                                     | [![npm](https://img.shields.io/npm/v/@kyco-utils/number)](https://www.npmjs.com/package/@kyco-utils/number)             |
| [`@kyco-utils/enums`](packages/enums)               | Runtime enums and Zod schemas, requires [Zod v4](https://zod.dev). | [![npm](https://img.shields.io/npm/v/@kyco-utils/enums)](https://www.npmjs.com/package/@kyco-utils/enums)               |
| [`@kyco-utils/types`](packages/types)               | Shared, dependency-free TypeScript types.                          | [![npm](https://img.shields.io/npm/v/@kyco-utils/types)](https://www.npmjs.com/package/@kyco-utils/types)               |
| [`@kyco-utils/biome-config`](packages/biome-config) | Shared [Biome](https://biomejs.dev) configuration.                 | [![npm](https://img.shields.io/npm/v/@kyco-utils/biome-config)](https://www.npmjs.com/package/@kyco-utils/biome-config) |

## Quick start

```sh
pnpm add @kyco-utils/search
```

```ts
import { filterBySearch } from '@kyco-utils/search'

const users = [
  { name: 'Renée Smith', city: 'Paris' },
  { name: 'John Smith', city: 'London' },
  { name: 'Jane Doe', city: 'Paris' },
]

filterBySearch(users, 'smith paris', (user) => [user.name, user.city])
// [{ name: 'Renée Smith', city: 'Paris' }]

filterBySearch(users, 'renee', (user) => [user.name, user.city])
// [{ name: 'Renée Smith', city: 'Paris' }]
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local development and the release process.

## License

[MIT](LICENSE)
