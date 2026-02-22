export interface CustomToolInput {
  id: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox'
  placeholder?: string
  defaultValue?: string
  options?: { label: string; value: string }[]
  required?: boolean
}

export interface CustomToolConfig {
  schemaVersion: 1
  id: string
  name: string
  description: string
  icon: string
  keywords: string[]
  category: 'custom'
  inputs: CustomToolInput[]
  transform: string
  outputFormat: 'text' | 'json' | 'markdown' | 'html'
  createdAt: string
  updatedAt: string
}
