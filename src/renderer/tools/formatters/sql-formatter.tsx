import { lazy } from 'react'
import { Database } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'sql-formatter',
  name: 'SQL Formatter',
  description: 'Format SQL queries with dialect support',
  category: 'formatters',
  icon: Database,
  keywords: ['sql', 'format', 'query', 'database', 'mysql', 'postgres'],
  clipboardPatterns: [
    { pattern: /\b(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i, priority: 75 }
  ],
  component: lazy(() => import('./sql-formatter-view')),
  aiEnabled: false
})
