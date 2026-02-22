import { lazy } from 'react'
import { Hash } from 'lucide-react'
import { registerTool } from '../registry'

registerTool({
  id: 'hash-generator',
  name: 'Hash Generator',
  description: 'Generate MD5, SHA-1, SHA-256, SHA-512, and bcrypt hashes',
  category: 'generators',
  icon: Hash,
  keywords: ['hash', 'md5', 'sha', 'sha256', 'sha512', 'checksum', 'digest', 'bcrypt'],
  component: lazy(() => import('./hash-generator-view'))
})
