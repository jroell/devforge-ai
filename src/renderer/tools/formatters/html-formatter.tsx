import { lazy } from 'react'
import { Globe } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'html-formatter',
  name: 'HTML Formatter',
  description: 'Format and minify HTML markup',
  category: 'formatters',
  icon: Globe,
  keywords: ['html', 'format', 'pretty', 'minify', 'markup', 'web'],
  clipboardPatterns: [{ pattern: /^\s*<!DOCTYPE|^\s*<html/i, priority: 88 }],
  component: lazy(() => import('./html-formatter-view')),
  aiEnabled: false
})
