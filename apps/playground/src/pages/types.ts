import { SupportedLocale } from '@kyco-utils/enums'
import { getNumberSeparators } from '@kyco-utils/number'
import type { NumberSeparators } from '@kyco-utils/types'

import { definePage, h, logGroup } from '../page'

const run = () => {
  const separators: NumberSeparators = getNumberSeparators(SupportedLocale.EN_GB)
  logGroup('NumberSeparators', { separators })
}

export default definePage({
  title: '@kyco-utils/types',
  render: (root) => {
    run()
    root.append(h('p', {}, 'Check console for details.'), h('button', { onclick: run }, 'Run again'))
  },
})
