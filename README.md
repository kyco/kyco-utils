# kyco-utils

Small, tree-shakeable TypeScript utilities. Install only the packages you need.

📖 **[Documentation & API reference](https://kyco.github.io/kyco-utils)**

## Packages

All packages are ESM only. See each package's README for details.

| Package                                             | Description                                        | Version                                                                                                                 |
| --------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [`@kyco-utils/types`](packages/types)               | Shared, dependency-free TypeScript types.          | [![npm](https://img.shields.io/npm/v/@kyco-utils/types)](https://www.npmjs.com/package/@kyco-utils/types)               |
| [`@kyco-utils/enums`](packages/enums)               | Runtime enums and their Zod schemas.               | [![npm](https://img.shields.io/npm/v/@kyco-utils/enums)](https://www.npmjs.com/package/@kyco-utils/enums)               |
| [`@kyco-utils/number`](packages/number)             | Locale-aware number utilities.                     | [![npm](https://img.shields.io/npm/v/@kyco-utils/number)](https://www.npmjs.com/package/@kyco-utils/number)             |
| [`@kyco-utils/biome-config`](packages/biome-config) | Shared [Biome](https://biomejs.dev) configuration. | [![npm](https://img.shields.io/npm/v/@kyco-utils/biome-config)](https://www.npmjs.com/package/@kyco-utils/biome-config) |

## Quick start

```sh
pnpm add @kyco-utils/number @kyco-utils/enums zod
```

```ts
import { SupportedLocale } from '@kyco-utils/enums'
import { getNumberSeparators } from '@kyco-utils/number'

getNumberSeparators(SupportedLocale.DE_DE)
// { thousandsSeparator: '.', decimalSeparator: ',' }
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local development and the release process.

## License

[MIT](LICENSE)
