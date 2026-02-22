import { lazy } from 'react'
import { Link } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'url-encoder',
  name: 'URL Encode/Decode',
  description: 'Encode and decode URL components',
  category: 'encoders',
  icon: Link,
  keywords: ['url', 'encode', 'decode', 'percent', 'uri', 'component', 'query', 'string'],
  clipboardPatterns: [{ pattern: /%[0-9A-Fa-f]{2}/, priority: 70 }],
  component: lazy(() => import('./url-encoder-view')),
  aiEnabled: false
})
