# @kyco-utils/search

<!-- #region docs -->

Dependency-free search that ignores case and accents, with highlighting.

## Install

```sh
pnpm add @kyco-utils/search
```

## Usage

### Filter a list

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

Every query word must match one of the texts, in any order.

### Match a single item

```ts
import { matchesSearch } from '@kyco-utils/search'

matchesSearch(['John Doe', 'New York'], 'john') // true
matchesSearch(['Jane Doe', 'Paris'], 'john') // false
```

### Highlight matches

```ts
import { getHighlightSegments } from '@kyco-utils/search'

getHighlightSegments('Café Royal', 'caf')
// [
//   { text: 'Caf', isMatch: true, isInMatchedWord: true },
//   { text: 'é', isMatch: false, isInMatchedWord: true },
//   { text: ' Royal', isMatch: false, isInMatchedWord: false },
// ]
```

Segments are plain text, so the query can't inject markup.

## Options

| Option                | Default | Description                                                                    |
| --------------------- | ------- | ------------------------------------------------------------------------------ |
| `ignoreDiacritics`    | `true`  | `e` matches `é`, `u` matches `ü`, and vice versa.                              |
| `matchFrom`           | `'any'` | `'any'` matches anywhere; `'wordStart'` only at the start of a word.           |
| `germanNormalization` | `false` | Also match `ä`, `ö`, `ü` with `ae`, `oe`, `ue`, e.g. `mueller` finds `Müller`. |

## Matching rules

- Case is ignored, and `ss` matches `ß`.
- The query is split into words on anything that isn't a letter or number.

<!-- #endregion docs -->

See the [API reference](https://kyco.github.io/kyco-utils/api/@kyco-utils/search) for all exports.

## License

[MIT](https://github.com/kyco/kyco-utils/blob/main/LICENSE)
