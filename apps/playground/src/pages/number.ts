import { SupportedLocale } from '@kyco-utils/enums'
import { getNumberSeparators } from '@kyco-utils/number'

import { definePage, h, logGroup } from '../page'

const run = () => {
  logGroup(
    'getNumberSeparators',
    Object.fromEntries(Object.values(SupportedLocale).map((locale) => [locale, getNumberSeparators(locale)])),
  )
}

export default definePage({
  title: '@kyco-utils/number',
  render: (root) => {
    run()
    root.append(h('p', {}, 'Check console for details.'), h('button', { onclick: run }, 'Run again'))
  },
})
