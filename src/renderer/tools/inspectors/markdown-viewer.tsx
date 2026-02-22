import { lazy } from 'react'
import { BookOpen } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'markdown-viewer',
  name: 'Markdown/Mermaid Viewer',
  description: 'Preview Markdown with GFM tables and Mermaid diagrams',
  category: 'inspectors',
  icon: BookOpen,
  keywords: ['markdown', 'mermaid', 'diagram', 'preview', 'render', 'chart', 'flowchart', 'sequence', 'gantt'],
  clipboardPatterns: [{ pattern: /^#|^\*\*|^-\s|^```|^>\s/m, priority: 60 }],
  component: lazy(() => import('./markdown-viewer-view')),
  aiEnabled: false
})
