# @kyco-utils/enums

<!-- #region docs -->

Runtime enums and [Zod](https://zod.dev) schemas.

## Install

```sh
pnpm add @kyco-utils/enums zod
```

## Usage

```ts
import { ColorMode, zColorMode } from '@kyco-utils/enums'

const mode: ColorMode = ColorMode.DARK // 'dark'
zColorMode.safeParse('blue').success // false
```

### Locales

```ts
import * as z from 'zod'
import { SupportedLocale, zSupportedLocale } from '@kyco-utils/enums'

zSupportedLocale.parse('en-GB') // 'en-GB'

const zUserLocale = z.enum([SupportedLocale.EN_US, SupportedLocale.EN_GB])
type UserLocale = z.infer<typeof zUserLocale>
```

For the types without `zod`, use [`@kyco-utils/types`](https://www.npmjs.com/package/@kyco-utils/types).

<!-- #endregion docs -->

See the [API reference](https://kyco.github.io/kyco-utils/api/@kyco-utils/enums) for all exports.

## License

[MIT](https://github.com/kyco/kyco-utils/blob/main/LICENSE)
