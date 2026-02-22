import { lazy } from 'react'
import { Palette } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'css-formatter',
  name: 'CSS Formatter',
  description: 'Format and minify CSS stylesheets',
  category: 'formatters',
  icon: Palette,
  keywords: ['css', 'format', 'style', 'minify', 'stylesheet'],
  clipboardPatterns: [{ pattern: /[.#][\w-]+\s*\{[\s\S]*\}/, priority: 70 }],
  component: lazy(() => import('./css-formatter-view')),
  aiEnabled: false
})
