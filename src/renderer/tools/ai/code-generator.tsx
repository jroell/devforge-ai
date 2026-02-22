import { lazy } from 'react'
import { FileType } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'code-generator',
  name: 'AI Type Generator',
  description: 'Generate TypeScript, Go, Rust, or Python types from JSON',
  category: 'ai',
  icon: FileType,
  keywords: ['type', 'interface', 'struct', 'generate', 'typescript', 'go', 'rust', 'python', 'pydantic'],
  aiEnabled: true,
  component: lazy(() => import('./code-generator-view'))
})
