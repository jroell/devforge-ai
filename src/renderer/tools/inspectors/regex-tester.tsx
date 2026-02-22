import { lazy } from 'react'
import { Regex } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'regex-tester',
  name: 'Regex Tester',
  description: 'Test regular expressions with real-time matching and capture groups',
  category: 'inspectors',
  icon: Regex,
  keywords: ['regex', 'regexp', 'regular', 'expression', 'pattern', 'match', 'test'],
  clipboardPatterns: [{ pattern: /^\/.*\/[gimsuy]*$/, priority: 40 }],
  component: lazy(() => import('./regex-tester-view')),
  aiEnabled: true
})
