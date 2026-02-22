import { lazy } from 'react'
import type { CustomToolConfig } from './types'
import { getIconByName } from './icon-lookup'
import { registerTool, unregisterTool, getToolsByCategory } from '../registry'

export function registerCustomTools(configs: CustomToolConfig[]): void {
  for (const config of configs) {
    registerTool({
      id: config.id,
      name: config.name,
      description: config.description,
      category: 'custom',
      icon: getIconByName(config.icon),
      keywords: config.keywords,
      component: lazy(() =>
        import('./CustomToolRenderer').then((mod) => ({
          default: () => mod.default({ toolId: config.id })
        }))
      ),
      aiEnabled: false
    })
  }
}

export function unregisterCustomTools(): void {
  const customTools = getToolsByCategory('custom')
  for (const tool of customTools) {
    if (tool.id !== 'ai-tool-builder') {
      unregisterTool(tool.id)
    }
  }
}
