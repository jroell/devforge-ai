import { lazy } from 'react'
import { Calculator } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'number-base',
  name: 'Number Base Converter',
  description: 'Convert between binary, octal, decimal, and hexadecimal',
  category: 'converters',
  icon: Calculator,
  keywords: ['number', 'base', 'binary', 'octal', 'decimal', 'hex', 'convert'],
  component: lazy(() => import('./number-base-view')),
  aiEnabled: false
})
