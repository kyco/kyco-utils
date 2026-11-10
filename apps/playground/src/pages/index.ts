import type { Page } from '../page'

import enums from './enums'
import number from './number'
import search from './search'
import types from './types'

export const pages: Page[] = [
  { id: 'search', ...search },
  { id: 'number', ...number },
  { id: 'enums', ...enums },
  { id: 'types', ...types },
]
