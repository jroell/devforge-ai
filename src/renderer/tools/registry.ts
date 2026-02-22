import type { ToolDefinition, ToolCategory } from './types'

const tools: ToolDefinition[] = []

export function registerTool(tool: ToolDefinition): void {
  const exists = tools.some((t) => t.id === tool.id)
  if (!exists) {
    tools.push(tool)
  }
}

export function unregisterTool(id: string): void {
  const idx = tools.findIndex((t) => t.id === id)
  if (idx !== -1) {
    tools.splice(idx, 1)
  }
}

export function getTools(): ToolDefinition[] {
  return tools
}

export function getToolById(id: string): ToolDefinition | undefined {
  return tools.find((t) => t.id === id)
}

export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return tools.filter((t) => t.category === category)
}

export function searchTools(query: string): ToolDefinition[] {
  const lower = query.toLowerCase()
  return tools.filter(
    (t) =>
      t.name.toLowerCase().includes(lower) ||
      t.description.toLowerCase().includes(lower) ||
      t.keywords.some((k) => k.toLowerCase().includes(lower))
  )
}
