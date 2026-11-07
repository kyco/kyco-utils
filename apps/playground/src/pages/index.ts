import type { Page } from '../page'

import enums from './enums'
import number from './number'
import types from './types'

export const pages: Page[] = [
  { id: 'enums', ...enums },
  { id: 'number', ...number },
  { id: 'types', ...types },
]
