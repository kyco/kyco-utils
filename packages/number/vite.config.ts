import { definePackageConfig } from '../../vite.package'

export default definePackageConfig({ neverBundle: ['@kyco-utils/enums', '@kyco-utils/types'] })
