export type Page = {
  id: string
  title: string
  render: (root: HTMLElement) => undefined | (() => void)
}

export const definePage = (page: Omit<Page, 'id'>) => page

export const logGroup = (label: string, entries: Record<string, unknown>) => {
  console.group(label)
  for (const [key, value] of Object.entries(entries)) {
    console.log(key, value)
  }
  console.groupEnd()
}

export const h = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] => {
  const el = Object.assign(document.createElement(tag), props)
  el.append(...children)
  return el
}
