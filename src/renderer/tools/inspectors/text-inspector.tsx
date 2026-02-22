import { lazy } from 'react'
import { FileSearch } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'text-inspector',
  name: 'Text Inspector',
  description: 'Analyze text with character, word, and line statistics',
  category: 'inspectors',
  icon: FileSearch,
  keywords: ['text', 'inspect', 'count', 'words', 'characters', 'statistics'],
  component: lazy(() => import('./text-inspector-view')),
  aiEnabled: false
})
