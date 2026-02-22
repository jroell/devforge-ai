import { lazy } from 'react'
import { Bug } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'log-analyzer',
  name: 'Log/Error Analyzer',
  description: 'AI-powered stack trace and error log analysis',
  category: 'ai',
  icon: Bug,
  keywords: ['log', 'error', 'stack', 'trace', 'analyze', 'debug', 'exception'],
  component: lazy(() => import('./log-analyzer-view')),
  aiEnabled: true,
})
