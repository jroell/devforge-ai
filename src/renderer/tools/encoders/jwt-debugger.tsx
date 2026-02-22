import { lazy } from 'react'
import { KeyRound } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'jwt-debugger',
  name: 'JWT Debugger',
  description: 'Decode and inspect JSON Web Tokens',
  category: 'encoders',
  icon: KeyRound,
  keywords: ['jwt', 'token', 'json', 'web', 'auth', 'decode', 'header', 'payload'],
  clipboardPatterns: [{ pattern: /^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, priority: 95 }],
  component: lazy(() => import('./jwt-debugger-view')),
  aiEnabled: true
})
