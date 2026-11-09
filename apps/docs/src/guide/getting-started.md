# Getting started

Install only the packages you need:

```sh
pnpm add @kyco-utils/number @kyco-utils/enums zod
```

```ts
import { SupportedLocale } from '@kyco-utils/enums'
import { getNumberSeparators } from '@kyco-utils/number'

getNumberSeparators(SupportedLocale.DE_DE)
// { thousandsSeparator: '.', decimalSeparator: ',' }
```

`@kyco-utils/enums` requires `zod` v4 as a peer dependency; the other packages have no peer dependencies. All packages are ESM only.
