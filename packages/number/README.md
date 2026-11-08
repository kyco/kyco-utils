# @kyco-utils/number

Locale-aware number utilities.

## Install

```sh
pnpm add @kyco-utils/number @kyco-utils/enums zod
```

## Usage

```ts
import { UserLocale } from '@kyco-utils/enums'
import { getNumberSeparators } from '@kyco-utils/number'

getNumberSeparators(UserLocale.DE_DE) // { thousandsSeparator: '.', decimalSeparator: ',' }
```

See the [API reference](https://kyco.github.io/kyco-utils/api/@kyco-utils/number) for all exports.

## License

[MIT](https://github.com/kyco/kyco-utils/blob/main/LICENSE)
