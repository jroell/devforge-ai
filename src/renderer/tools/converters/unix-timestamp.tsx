import { lazy } from 'react'
import { Clock } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'unix-timestamp',
  name: 'Unix Timestamp',
  description: 'Convert between Unix timestamps and human-readable dates',
  category: 'converters',
  icon: Clock,
  keywords: ['unix', 'timestamp', 'epoch', 'date', 'time', 'convert'],
  clipboardPatterns: [{ pattern: /^\d{10,13}$/, priority: 80 }],
  component: lazy(() => import('./unix-timestamp-view'))
})
