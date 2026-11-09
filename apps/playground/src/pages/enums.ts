import { ColorMode, SupportedLocale, zColorMode, zSupportedLocale } from '@kyco-utils/enums'

import { definePage, h, logGroup } from '../page'

const run = () => {
  logGroup('ColorMode', { ColorMode, values: Object.values(ColorMode) })
  logGroup('SupportedLocale', { SupportedLocale, values: Object.values(SupportedLocale) })
  logGroup('zColorMode.safeParse', {
    dark: zColorMode.safeParse('dark'),
    invalid: zColorMode.safeParse('invalid'),
  })
  logGroup('zSupportedLocale.safeParse', {
    'de-DE': zSupportedLocale.safeParse('de-DE'),
    'xx-XX': zSupportedLocale.safeParse('xx-XX'),
  })
}

export default definePage({
  title: '@kyco-utils/enums',
  render: (root) => {
    run()
    root.append(h('p', {}, 'Check console for details.'), h('button', { onclick: run }, 'Run again'))
  },
})
