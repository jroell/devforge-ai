import { lazy } from 'react'
import { Hash } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'hex-ascii',
  name: 'Hex/ASCII Converter',
  description: 'Convert between hexadecimal and ASCII text',
  category: 'encoders',
  icon: Hash,
  keywords: ['hex', 'ascii', 'convert', 'hexadecimal', 'text'],
  clipboardPatterns: [{ pattern: /^(?:[0-9a-f]{2}\s){3,}/i, priority: 68 }],
  component: lazy(() => import('./hex-ascii-view')),
  aiEnabled: false
})
