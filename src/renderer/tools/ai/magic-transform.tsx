import { lazy } from 'react'
import { Wand2 } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'magic-transform',
  name: 'Magic Transform',
  description: 'Transform data using natural language prompts',
  category: 'ai',
  icon: Wand2,
  keywords: ['transform', 'convert', 'magic', 'prompt', 'natural', 'language', 'extract'],
  aiEnabled: true,
  component: lazy(() => import('./magic-transform-view'))
})
