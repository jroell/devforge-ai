import { lazy } from 'react'
import { Table } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'json-csv',
  name: 'JSON ↔ CSV Converter',
  description: 'Convert between JSON arrays and CSV format',
  category: 'converters',
  icon: Table,
  keywords: ['json', 'csv', 'convert', 'table', 'spreadsheet'],
  component: lazy(() => import('./json-csv-view')),
  aiEnabled: false
})
