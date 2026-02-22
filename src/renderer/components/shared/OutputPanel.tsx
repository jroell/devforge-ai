import { ScrollArea } from '@/components/ui/scroll-area'
import { CopyButton } from './CopyButton'

interface OutputPanelProps {
  label: string
  value: string
  placeholder?: string
}

export function OutputPanel({ label, value, placeholder = 'Output will appear here...' }: OutputPanelProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {value && <CopyButton text={value} />}
      </div>
      <ScrollArea className="h-full rounded-md border border-border bg-muted/30">
        <pre className="p-3 font-mono text-sm whitespace-pre-wrap break-all">
          {value || <span className="text-muted-foreground">{placeholder}</span>}
        </pre>
      </ScrollArea>
    </div>
  )
}
