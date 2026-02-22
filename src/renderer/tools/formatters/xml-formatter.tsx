import { lazy } from 'react'
import { FileCode } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'xml-formatter',
  name: 'XML Formatter',
  description: 'Format and minify XML documents',
  category: 'formatters',
  icon: FileCode,
  keywords: ['xml', 'format', 'pretty', 'minify', 'markup'],
  clipboardPatterns: [{ pattern: /^\s*<\?xml|^\s*<[a-zA-Z][\s\S]*<\/[a-zA-Z]/s, priority: 85 }],
  component: lazy(() => import('./xml-formatter-view')),
  aiEnabled: false
})
