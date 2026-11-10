# @kyco-utils/number

<!-- #region docs -->

Locale-aware number utilities.

## Install

```sh
pnpm add @kyco-utils/number
```

## Usage

```ts
import { getNumberSeparators } from '@kyco-utils/number'

getNumberSeparators('en-US') // { thousandsSeparator: ',', decimalSeparator: '.' }
getNumberSeparators('de-DE') // { thousandsSeparator: '.', decimalSeparator: ',' }
```

<!-- #endregion docs -->

See the [API reference](https://kyco.github.io/kyco-utils/api/@kyco-utils/number) for all exports.

## License

[MIT](https://github.com/kyco/kyco-utils/blob/main/LICENSE)
