import { lazy } from 'react'
import { Bot } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'ai-tool-builder',
  name: 'AI Tool Builder',
  description: 'Create custom tools with AI assistance',
  category: 'custom',
  icon: Bot,
  keywords: ['ai', 'custom', 'builder', 'create', 'tool', 'generate'],
  component: lazy(() => import('./tool-builder-view')),
  aiEnabled: true
})
