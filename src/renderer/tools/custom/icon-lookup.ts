import { icons, type LucideIcon } from 'lucide-react'

export function getIconByName(name: string): LucideIcon {
  return (icons as Record<string, LucideIcon>)[name] ?? icons.Wrench
}
