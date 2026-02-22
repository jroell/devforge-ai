import { lazy } from 'react'
import { Binary } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'base64',
  name: 'Base64 Encode/Decode',
  description: 'Encode and decode Base64 strings',
  category: 'encoders',
  icon: Binary,
  keywords: ['base64', 'encode', 'decode', 'binary', 'text'],
  clipboardPatterns: [
    { pattern: /^[A-Za-z0-9+/]{20,}={0,2}$/, priority: 80 }
  ],
  component: lazy(() => import('./base64-view')),
  aiEnabled: false
})
