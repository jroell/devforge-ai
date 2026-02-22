import { lazy } from 'react'
import { CaseSensitive } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'text-case',
  name: 'Text Case Converter',
  description: 'Convert text between camelCase, snake_case, kebab-case, and more',
  category: 'converters',
  icon: CaseSensitive,
  keywords: ['case', 'camel', 'snake', 'kebab', 'pascal', 'title', 'convert', 'text'],
  component: lazy(() => import('./text-case-view')),
  aiEnabled: false
})
