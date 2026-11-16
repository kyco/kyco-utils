# @kyco-utils/search

<!-- #region docs -->

Dependency-free search with [match-sorter](https://github.com/kentcdodds/match-sorter)-style ranking and highlighting.
Matches word by word, ignoring case, accents and punctuation inside words.

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

Every query word must match one of the texts, in any order. Results are sorted best first, see [Ranking](#ranking).

- The order of the texts from `getTexts` matters: a match in an earlier text ranks higher.
- `getTexts` may return `null` or `undefined` texts; they never match.
- The query can also be an array of words, e.g. `['smith', 'paris']`.
- A query without words (empty or only punctuation) matches everything: `filterBySearch` returns `items` itself, not a
  copy.

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

Pass the same options as for filtering, so highlights match the results. Render the segments, e.g. in React:

```tsx
getHighlightSegments(user.name, query).map((segment, i) =>
  segment.isMatch ? <mark key={i}>{segment.text}</mark> : <span key={i}>{segment.text}</span>,
)
```

Segments are plain text, so the query can't inject markup. Use `isInMatchedWord` to also style the rest of a matched
word. For custom ranges, use `findMatchRanges` and `splitByMatchRanges` directly.

## Options

| Option                | Default     | Description                                                                    |
| --------------------- | ----------- | ------------------------------------------------------------------------------ |
| `threshold`           | `'matches'` | The lowest [tier](#tiers) that still counts as a match.                        |
| `ignoreDiacritics`    | `true`      | `e` matches `é`, `u` matches `ü`, and vice versa.                              |
| `germanNormalization` | `true`      | Also match `ä`, `ö`, `ü` with `ae`, `oe`, `ue`, e.g. `mueller` finds `Müller`. |
| `sort`                | `true`      | Sort `filterBySearch` results by relevance; `false` keeps the input order.     |

## Tiers

Best first, as in match-sorter:

| Tier             | The text…                       | Example                                 |
| ---------------- | ------------------------------- | --------------------------------------- |
| `equal`          | equals the query                | `paris` → Paris                         |
| `startsWith`     | starts with it                  | `par` → Paris                           |
| `wordStartsWith` | has a word starting with it     | `sm` → John Smith                       |
| `contains`       | contains it                     | `voi` → Invoice                         |
| `acronym`        | has word initials containing it | `ibm` → International Business Machines |
| `matches`        | contains its letters in order   | `muler` → Müller, `mlr` → Müller        |

`threshold` is one of these tiers: e.g. `threshold: 'contains'` drops `acronym` and `matches` results. Typos with a
wrong letter (`mxller`) aren't found, as in match-sorter.

## Ranking

Each query word is ranked on its own, and an item ranks by its weakest word. A query of several words is also ranked as
a whole, and the better of the two counts, so `john smith` is `equal` to `John Smith`.

`filterBySearch` sorts by:

1. Tier.
2. Within the tier: an exact-case match first for `equal`, closer letters first for `matches`.
3. The order of the texts from `getTexts`: a match in an earlier text first.
4. Input order.

## Matching rules

- Case is ignored, and `ss` matches `ß`.
- Punctuation between letters is ignored, so `rocknroll` finds `Rock'n'Roll` and `email` finds `e-mail`. Spaces still
  separate words.
- The query is split into words on anything that isn't a letter or number. The words can match in any order.
- Highlights match what was ranked: the matched substring, the initials of an acronym, or the letters in order.

## Differences from match-sorter

- Matches word by word, so `smith john` finds `John Smith`.
- Ignores punctuation inside words and supports German spelling (`ä` ↔ `ae`).
- Returns highlight ranges for every tier.
- Breaks ties in input order, not alphabetically.

<!-- #endregion docs -->

See the [API reference](https://kyco.github.io/kyco-utils/api/@kyco-utils/search) for all exports.

## License

[MIT](https://github.com/kyco/kyco-utils/blob/main/LICENSE)
