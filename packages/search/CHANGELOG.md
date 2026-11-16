# @kyco-utils/search

## 1.0.0

### Major Changes

- dcf994d: - Rank results with match-sorter-style tiers: `filterBySearch` now sorts best first (set `sort: false` to keep input order).
  - Add letters-in-order (`mlr` → Müller) and acronym (`ibm` → International Business Machines) matching.
  - Match the whole query as well as each word, and ignore punctuation inside words (`rocknroll` → Rock'n'Roll).
  - Add the `threshold` and `sort` options and the `SearchThreshold` type.
  - Breaking: remove `matchFrom`; use `threshold: 'wordStartsWith'` instead.
  - Breaking: `germanNormalization` now defaults to `true`.

## 0.1.1

### Patch Changes

- 15a14d5: Clarify the wording of the `ignoreDiacritics` and `germanNormalization` docs.

## 0.1.0

### Minor Changes

- 60a72a3: Initial release: `matchesSearch`, `filterBySearch`, `findMatchRanges`, `splitByMatchRanges` and `getHighlightSegments`.
