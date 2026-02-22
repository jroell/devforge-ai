import { lazy } from 'react'
import { Fingerprint } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'uuid-generator',
  name: 'UUID Generator',
  description: 'Generate UUIDs (v4) and ULID-style sortable IDs',
  category: 'generators',
  icon: Fingerprint,
  keywords: ['uuid', 'guid', 'ulid', 'unique', 'id', 'generate'],
  clipboardPatterns: [
    {
      pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      priority: 50
    }
  ],
  component: lazy(() => import('./uuid-generator-view'))
})
