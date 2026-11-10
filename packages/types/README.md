# @kyco-utils/types

<!-- #region docs -->

Shared, dependency-free TypeScript types.

## Install

```sh
pnpm add @kyco-utils/types
```

## Usage

```ts
import type { ColorMode, NumberSeparators, SupportedLocale } from '@kyco-utils/types'

const separators: NumberSeparators = { thousandsSeparator: ',', decimalSeparator: '.' }
const locale: SupportedLocale = 'en-US'
const mode: ColorMode = 'dark'
```

Runtime enums and Zod schemas live in [`@kyco-utils/enums`](https://www.npmjs.com/package/@kyco-utils/enums).

<!-- #endregion docs -->

See the [API reference](https://kyco.github.io/kyco-utils/api/@kyco-utils/types) for all exports.

## License

[MIT](https://github.com/kyco/kyco-utils/blob/main/LICENSE)
