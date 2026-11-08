# @kyco-utils/enums

Shared runtime enums and their [Zod](https://zod.dev) schemas.

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

See the [API reference](https://kyco.github.io/kyco-utils/api/@kyco-utils/enums) for all exports.

## License

[MIT](https://github.com/kyco/kyco-utils/blob/main/LICENSE)
