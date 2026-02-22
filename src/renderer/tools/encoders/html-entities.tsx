import { lazy } from 'react'
import { Code } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'html-entities',
  name: 'HTML Entity Encoder/Decoder',
  description: 'Encode and decode HTML entities',
  category: 'encoders',
  icon: Code,
  keywords: ['html', 'entity', 'encode', 'decode', 'escape', 'unescape'],
  clipboardPatterns: [{ pattern: /&(?:amp|lt|gt|quot|#\d+|#x[\da-f]+);/i, priority: 82 }],
  component: lazy(() => import('./html-entities-view')),
  aiEnabled: false
})
