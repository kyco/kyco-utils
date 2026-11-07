import './style.css'

import { pages } from './pages'

const nav = document.querySelector<HTMLElement>('#nav')
const root = document.querySelector<HTMLElement>('#page')
const modeEl = document.querySelector<HTMLElement>('#mode')

if (modeEl) modeEl.textContent = import.meta.env.MODE === 'dist' ? 'resolving: dist/' : 'resolving: src/'

let cleanup: (() => void) | undefined

const navigate = () => {
  if (!nav || !root) return
  const id = location.hash.replace(/^#\//, '') || pages[0]?.id
  const page = pages.find((p) => p.id === id) ?? pages[0]
  if (!page) return

  for (const link of nav.querySelectorAll('a')) {
    if (link.dataset.id === page.id) link.setAttribute('aria-current', 'page')
    else link.removeAttribute('aria-current')
  }

  cleanup?.()
  root.replaceChildren()
  const heading = document.createElement('h2')
  heading.textContent = page.title
  root.append(heading)
  console.log(`%c▶ ${page.title}`, 'font-weight: bold')
  cleanup = page.render(root) ?? undefined
}

nav?.append(
  ...pages.map((p) => {
    const a = document.createElement('a')
    a.href = `#/${p.id}`
    a.dataset.id = p.id
    a.textContent = p.title
    return a
  }),
)

window.addEventListener('hashchange', navigate)
navigate()
