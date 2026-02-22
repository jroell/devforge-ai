import { lazy } from 'react'
import { FileJson2 } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'js-formatter',
  name: 'JS/TS Formatter',
  description: 'Format JavaScript and TypeScript with Prettier',
  category: 'formatters',
  icon: FileJson2,
  keywords: ['javascript', 'js', 'typescript', 'ts', 'format', 'prettier'],
  clipboardPatterns: [{ pattern: /(?:function|const|let|var|import|export|=>)\s/, priority: 65 }],
  component: lazy(() => import('./js-formatter-view')),
  aiEnabled: false
})
