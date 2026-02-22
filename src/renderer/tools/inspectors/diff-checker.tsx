import { lazy } from 'react'
import { GitCompare } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'diff-checker',
  name: 'Diff Checker',
  description: 'Compare two texts and highlight differences',
  category: 'inspectors',
  icon: GitCompare,
  keywords: ['diff', 'compare', 'difference', 'text', 'merge'],
  component: lazy(() => import('./diff-checker-view')),
  aiEnabled: false
})
