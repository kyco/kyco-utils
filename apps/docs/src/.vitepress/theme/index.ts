import type { Theme } from 'vitepress'
import { inBrowser, onContentUpdated } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

const STORAGE_KEY = 'kyco-utils:docs:package-manager'
const PACKAGE_MANAGERS = new Set(['pnpm', 'npm', 'yarn', 'bun'])

const readPreference = () => {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

const savePreference = (name: string) => {
  try {
    localStorage.setItem(STORAGE_KEY, name)
  } catch {
    // Storage unavailable: tabs still sync on this page, the choice just isn't remembered.
  }
}

const getTitle = (input: HTMLInputElement) =>
  document.querySelector(`label[for="${input.id}"]`)?.getAttribute('data-title') ?? ''

/**
 * Selects the tab titled `name` in every code group that has one. Toggles the same classes as VitePress's own click
 * handler, without clicking, so the page doesn't scroll to each group.
 */
const selectTab = (name: string) => {
  for (const group of document.querySelectorAll('.vp-code-group')) {
    const inputs = Array.from(group.querySelectorAll<HTMLInputElement>('.tabs input'))
    const index = inputs.findIndex((candidate) => getTitle(candidate) === name)
    const input = inputs[index]
    const blocks = group.querySelector('.blocks')?.children
    if (!input || !blocks) continue
    input.checked = true
    for (const [i, block] of Array.from(blocks).entries()) block.classList.toggle('active', i === index)
  }
}

export default {
  extends: DefaultTheme,
  setup() {
    onContentUpdated(() => {
      const preference = readPreference()
      // Next frame: in dev, VitePress resets code groups to their first tab on the same hook.
      if (preference) requestAnimationFrame(() => selectTab(preference))
    })
  },
  enhanceApp() {
    if (!inBrowser) return
    window.addEventListener('click', (event) => {
      const input = event.target
      if (!(input instanceof HTMLInputElement) || !input.matches('.vp-code-group input')) return
      const name = getTitle(input)
      if (!PACKAGE_MANAGERS.has(name)) return
      savePreference(name)
      selectTab(name)
    })
  },
} satisfies Theme
