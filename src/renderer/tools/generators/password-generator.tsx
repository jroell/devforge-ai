import { lazy } from 'react'
import { KeyRound } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'password-generator',
  name: 'Password Generator',
  description: 'Generate secure random passwords with custom options',
  category: 'generators',
  icon: KeyRound,
  keywords: ['password', 'generate', 'random', 'secure', 'strong'],
  component: lazy(() => import('./password-generator-view')),
  aiEnabled: false
})
