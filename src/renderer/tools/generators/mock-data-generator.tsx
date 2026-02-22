import { lazy } from 'react'
import { Database } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'mock-data-generator',
  name: 'AI Mock Data',
  description: 'Generate realistic mock data with AI',
  category: 'generators',
  icon: Database,
  keywords: ['mock', 'fake', 'data', 'generate', 'sample', 'test', 'seed', 'lorem'],
  aiEnabled: true,
  component: lazy(() => import('./mock-data-generator-view'))
})
