# Getting started

Install only the packages you need:

```sh
pnpm add @kyco-utils/number @kyco-utils/enums zod
```

```ts
import { UserLocale } from '@kyco-utils/enums'
import { getNumberSeparators } from '@kyco-utils/number'

getNumberSeparators(UserLocale.DE_DE)
// { thousandsSeparator: '.', decimalSeparator: ',' }
```

`@kyco-utils/enums` and `@kyco-utils/number` require `zod` v4 as a peer dependency. All packages are ESM only.
