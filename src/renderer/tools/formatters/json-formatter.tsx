import { lazy } from 'react'
import { Braces } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'json-formatter',
  name: 'JSON Formatter',
  description: 'Format, minify, and validate JSON',
  category: 'formatters',
  icon: Braces,
  keywords: ['json', 'format', 'minify', 'validate', 'pretty', 'print'],
  clipboardPatterns: [{ pattern: /^\s*[\[{][\s\S]*[\]}]\s*$/, priority: 90 }],
  component: lazy(() => import('./json-formatter-view')),
  aiEnabled: true
})
