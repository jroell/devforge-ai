import { lazy } from 'react'
import { FileText } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'yaml-formatter',
  name: 'YAML Formatter',
  description: 'Format and validate YAML documents',
  category: 'formatters',
  icon: FileText,
  keywords: ['yaml', 'yml', 'format', 'validate', 'config'],
  clipboardPatterns: [{ pattern: /^---\s*\n|^\w[\w-]*:\s/m, priority: 72 }],
  component: lazy(() => import('./yaml-formatter-view')),
  aiEnabled: false
})
