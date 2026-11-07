import { ColorMode, UserLocale, zColorMode, zUserLocale } from '@kyco-utils/enums'

import { definePage, h, logGroup } from '../page'

const run = () => {
  logGroup('ColorMode', { ColorMode, values: Object.values(ColorMode) })
  logGroup('UserLocale', { UserLocale, values: Object.values(UserLocale) })
  logGroup('zColorMode.safeParse', {
    dark: zColorMode.safeParse('dark'),
    invalid: zColorMode.safeParse('invalid'),
  })
  logGroup('zUserLocale.safeParse', {
    'de-DE': zUserLocale.safeParse('de-DE'),
    'xx-XX': zUserLocale.safeParse('xx-XX'),
  })
}

export default definePage({
  title: '@kyco-utils/enums',
  render: (root) => {
    run()
    root.append(h('p', {}, 'Check console for details.'), h('button', { onclick: run }, 'Run again'))
  },
})
