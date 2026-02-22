import { lazy } from 'react'
import { Timer } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'cron-parser',
  name: 'Cron Parser',
  description: 'Parse and explain cron expressions',
  category: 'inspectors',
  icon: Timer,
  keywords: ['cron', 'schedule', 'crontab', 'timer', 'job'],
  component: lazy(() => import('./cron-parser-view')),
  aiEnabled: true,
})
