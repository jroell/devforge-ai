import { type LucideIcon } from 'lucide-react'
import { type LazyExoticComponent, type ComponentType } from 'react'

export type ToolCategory = 'formatters' | 'encoders' | 'converters' | 'generators' | 'inspectors' | 'ai' | 'custom'

export interface ToolDefinition {
  id: string
  name: string
  description: string
  category: ToolCategory
  icon: LucideIcon
  clipboardPatterns?: { pattern: RegExp; priority: number }[]
  keywords: string[]
  component: LazyExoticComponent<ComponentType>
  aiEnabled?: boolean
}

export const categoryLabels: Record<ToolCategory, string> = {
  formatters: 'Formatters & Minifiers',
  encoders: 'Encoders & Decoders',
  converters: 'Converters',
  generators: 'Generators',
  inspectors: 'Inspectors & Text',
  ai: 'AI Tools',
  custom: 'Custom Tools'
}

export const categoryOrder: ToolCategory[] = [
  'formatters', 'encoders', 'converters', 'generators', 'inspectors', 'ai', 'custom'
]
