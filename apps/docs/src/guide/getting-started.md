# Getting started

Install only the packages you need:

```sh
pnpm add @kyco-utils/number @kyco-utils/enums
```

```ts
import { UserLocale } from '@kyco-utils/enums'
import { getNumberSeparators } from '@kyco-utils/number'

getNumberSeparators(UserLocale.DE_DE)
// { thousandsSeparator: '.', decimalSeparator: ',' }
```

`@kyco-utils/enums` requires `zod` as a peer dependency.
