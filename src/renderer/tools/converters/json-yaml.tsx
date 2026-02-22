import { lazy } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'json-yaml',
  name: 'JSON ↔ YAML Converter',
  description: 'Convert between JSON and YAML formats',
  category: 'converters',
  icon: ArrowLeftRight,
  keywords: ['json', 'yaml', 'convert', 'transform'],
  component: lazy(() => import('./json-yaml-view')),
  aiEnabled: false
})
