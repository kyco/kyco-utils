import {
  filterBySearch,
  getHighlightSegments,
  matchesSearch,
  type SearchOptions,
  type SearchThreshold,
} from '@kyco-utils/search'

import { definePage, h } from '../page'

type Entry = { name: string; city: string; id: number }
type Highlight = 'letters' | 'words' | 'both'
type State = {
  query: string
  ignoreDiacritics: boolean
  germanNormalization: boolean
  threshold: SearchThreshold
  sort: boolean
  highlight: Highlight
}

const STORAGE_KEY = 'kyco-utils:playground:search'

const THRESHOLDS: readonly SearchThreshold[] = [
  'equal',
  'startsWith',
  'wordStartsWith',
  'contains',
  'acronym',
  'matches',
]

const ENTRIES: Entry[] = [
  { name: 'Renée Smith', city: 'Paris', id: 1001 },
  { name: 'John Smith', city: 'London', id: 1002 },
  { name: 'Jane Doe', city: 'Paris', id: 1008 },
  { name: 'José García', city: 'Málaga', id: 1003 },
  { name: 'Chloé Dubois', city: 'Montréal', id: 1004 },
  { name: 'Søren Nielsen', city: 'Århus', id: 1005 },
  { name: 'Łukasz Nowak', city: 'Kraków', id: 1006 },
  { name: 'Smith John', city: 'Boston', id: 1007 },
  { name: 'Café Royal', city: 'New York', id: 2001 },
  { name: 'Invoice number', city: 'Dublin', id: 2002 },
  { name: 'e-mail', city: 'Edinburgh', id: 2003 },
  { name: 'anna@example.com', city: 'Chicago', id: 2004 },
  { name: 'C# (language)', city: 'Redmond', id: 2005 },
  { name: 'Müller', city: 'Zürich', id: 3001 },
  { name: 'Mueller', city: 'Berlin', id: 3002 },
  { name: 'Muller', city: 'Lyon', id: 3003 },
  { name: 'Bär', city: 'Bern', id: 3004 },
  { name: 'Straße', city: 'Vienna', id: 3005 },
  { name: "Rock'n'Roll Café", city: 'Memphis', id: 4001 },
  { name: 'International Business Machines', city: 'Armonk', id: 4002 },
  { name: "O'Neil", city: 'Dublin', id: 4003 },
]

const DEFAULT_STATE: State = {
  query: '',
  ignoreDiacritics: true,
  germanNormalization: true,
  threshold: 'matches',
  sort: true,
  highlight: 'both',
}

const EXAMPLES: { query: string; note: string }[] = [
  { query: 'renee', note: 'Renée: accents are ignored by default.' },
  { query: 'smith paris', note: 'Two words, any order, across fields: Renée Smith.' },
  { query: 'smith, john', note: 'The comma splits words, so it finds Smith John.' },
  { query: 'john smith', note: 'The whole query equals John Smith, so it ranks first.' },
  { query: 'voice', note: 'Invoice (contains), nothing at threshold wordStartsWith.' },
  { query: 'krakow', note: 'Kraków; nothing without ignoreDiacritics.' },
  { query: 'strasse', note: 'ss always matches ß: Straße.' },
  { query: 'mueller', note: 'Mueller and Müller; only Mueller without germanNormalization.' },
  { query: 'er', note: 'Never Bär (baer): spelling out only runs for umlaut-like words.' },
  { query: 'rocknroll', note: "Rock'n'Roll Café: punctuation inside words is ignored." },
  { query: 'ibm', note: 'International Business Machines, as an acronym.' },
  { query: 'muler', note: 'Müller, Mueller, Muller: letters in order.' },
  { query: 'mlr', note: 'Letters in order; nothing at a stricter threshold.' },
]

const loadState = (): State => {
  try {
    const stored: Partial<State> | null = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (stored === null || typeof stored !== 'object') return { ...DEFAULT_STATE }
    const merged = { ...DEFAULT_STATE, ...stored }
    const { query, ignoreDiacritics, germanNormalization, sort, highlight } = merged
    const threshold = THRESHOLDS.includes(merged.threshold) ? merged.threshold : DEFAULT_STATE.threshold
    return { query, ignoreDiacritics, germanNormalization, threshold, sort, highlight }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

const saveState = (state: State) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage unavailable (private mode, blocked): the page still works, it just won't remember.
  }
}

const getTexts = (entry: Entry) => [entry.name, entry.city, String(entry.id)]

const getTier = (entry: Entry, query: string, options: SearchOptions) => {
  return THRESHOLDS.find((threshold) => matchesSearch(getTexts(entry), query, { ...options, threshold }))
}

const highlighted = (text: string, query: string, options: SearchOptions) =>
  getHighlightSegments(text, query, options).map((segment) =>
    h('span', {
      className: [segment.isInMatchedWord && 'seg-word', segment.isMatch && 'seg-match'].filter(Boolean).join(' '),
      textContent: segment.text,
    }),
  )

const checkbox = (label: string, checked: boolean, onChange: (checked: boolean) => void) =>
  h(
    'label',
    { className: 'search-toggle' },
    h('input', { type: 'checkbox', checked, onchange: (e) => onChange((e.target as HTMLInputElement).checked) }),
    label,
  )

const radios = <T extends string>(name: string, values: readonly T[], current: T, onChange: (value: T) => void) =>
  h(
    'fieldset',
    { className: 'search-toggle' },
    h('legend', {}, name),
    ...values.map((value) =>
      h(
        'label',
        {},
        h('input', { type: 'radio', name, value, checked: value === current, onchange: () => onChange(value) }),
        value,
      ),
    ),
  )

export default definePage({
  title: '@kyco-utils/search',
  render: (root) => {
    const state = loadState()
    const options = (): SearchOptions => ({
      ignoreDiacritics: state.ignoreDiacritics,
      germanNormalization: state.germanNormalization,
      threshold: state.threshold,
      sort: state.sort,
    })

    const input = h('input', {
      type: 'search',
      className: 'search-input',
      placeholder: 'Search name, city or id…',
      value: state.query,
      oninput: () => {
        state.query = input.value
        update()
      },
    })
    const stats = h('p', { className: 'search-stats' })
    const toggles = h('div', { className: 'search-toggles' })
    const code = h('code')
    const copyButton = h('button', {
      type: 'button',
      textContent: 'Copy',
      onclick: async () => {
        try {
          await navigator.clipboard.writeText(code.textContent ?? '')
          copyButton.textContent = 'Copied'
        } catch {
          copyButton.textContent = 'Copy failed'
        }
        setTimeout(() => {
          copyButton.textContent = 'Copy'
        }, 1500)
      },
    })
    const resetButton = h('button', {
      type: 'button',
      textContent: 'Reset to defaults',
      onclick: () => {
        const { query } = state
        Object.assign(state, DEFAULT_STATE, { query })
        renderToggles()
        update()
      },
    })
    const examples = h('ul', { className: 'search-examples', hidden: true })
    const examplesToggle = h('button', {
      type: 'button',
      className: 'search-examples-toggle',
      ariaExpanded: 'false',
      onclick: () => {
        examples.hidden = !examples.hidden
        examplesToggle.ariaExpanded = String(!examples.hidden)
        examplesToggle.textContent = examples.hidden ? 'Show example queries' : 'Hide example queries'
      },
      textContent: 'Show example queries',
    })
    const results = h('ul', { className: 'search-results' })

    const setQuery = (query: string) => {
      state.query = query
      input.value = query
      update()
      input.focus()
    }

    const renderToggles = () => {
      toggles.replaceChildren(
        checkbox('ignoreDiacritics', state.ignoreDiacritics, (checked) => {
          state.ignoreDiacritics = checked
          update()
        }),
        checkbox('germanNormalization', state.germanNormalization, (checked) => {
          state.germanNormalization = checked
          update()
        }),
        checkbox('sort', state.sort, (checked) => {
          state.sort = checked
          update()
        }),
        radios('threshold', THRESHOLDS, state.threshold, (value) => {
          state.threshold = value
          update()
        }),
        radios('highlight', ['letters', 'words', 'both'] as const, state.highlight, (value) => {
          state.highlight = value
          update()
        }),
      )
    }

    const renderExamples = () => {
      examples.replaceChildren(
        ...EXAMPLES.map(({ query, note }) => {
          const finds = ENTRIES.filter((entry) => matchesSearch(getTexts(entry), query, options()))
          return h(
            'li',
            {},
            h('button', { onclick: () => setQuery(query) }, query),
            h('span', {}, note),
            h(
              'span',
              { className: 'search-finds' },
              `Now: ${finds.length > 0 ? finds.map((entry) => entry.name).join(', ') : 'nothing'}`,
            ),
          )
        }),
      )
    }

    const renderResults = () => {
      const start = performance.now()
      const found = filterBySearch(ENTRIES, state.query, getTexts, options())
      const ms = performance.now() - start

      stats.textContent = `${found.length} of ${ENTRIES.length} results in ${ms.toFixed(3)} ms`
      results.dataset.highlight = state.highlight
      results.replaceChildren(
        ...found.map((entry) =>
          h(
            'li',
            {},
            h('span', { className: 'search-name' }, ...highlighted(entry.name, state.query, options())),
            h('span', { className: 'search-city' }, ...highlighted(entry.city, state.query, options())),
            h('span', { className: 'search-id' }, ...highlighted(String(entry.id), state.query, options())),
            h(
              'span',
              { className: 'search-tier' },
              state.query.trim() === '' ? '' : (getTier(entry, state.query, options()) ?? ''),
            ),
          ),
        ),
      )
      if (found.length === 0) results.append(h('li', { className: 'search-empty' }, 'No results'))
    }

    const renderCode = () => {
      const { ignoreDiacritics, germanNormalization, threshold, sort } = options()
      const query = JSON.stringify(state.query)
      code.textContent = [
        'const options: SearchOptions = {',
        `  ignoreDiacritics: ${ignoreDiacritics},`,
        `  germanNormalization: ${germanNormalization},`,
        `  threshold: '${threshold}',`,
        `  sort: ${sort},`,
        '}',
        '',
        `filterBySearch(entries, ${query}, (entry) => [entry.name, entry.city, String(entry.id)], options)`,
        `getHighlightSegments(text, ${query}, options)`,
      ].join('\n')
    }

    const update = () => {
      saveState(state)
      renderCode()
      renderExamples()
      renderResults()
    }

    root.append(
      h('div', { className: 'search-bar' }, input, examplesToggle),
      stats,
      examples,
      h(
        'div',
        { className: 'search-options' },
        h(
          'div',
          { className: 'search-code' },
          h('pre', {}, code),
          h('div', { className: 'search-code-actions' }, copyButton, resetButton),
        ),
        h('div', { className: 'search-options-controls' }, toggles),
      ),
      h('h3', {}, 'Results'),
      results,
    )

    renderToggles()
    update()
    input.focus()
    return undefined
  },
})
