import { Lock } from 'lucide-react'
import { useLicenseStore } from '@/stores/license'
import { useUsageStore } from '@/stores/usage'
import { Button } from '@/components/ui/button'

export function UpgradeGate() {
  const { status, upgrade } = useLicenseStore()
  const topTools = useUsageStore((s) => s.getTopTools(4))
  const totalUses = useUsageStore((s) => s.getTotalUses())
  const entryCount = useUsageStore((s) => Object.keys(s.entries).length)

  if (status !== 'expired') {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-8 w-8 text-primary" />
        </div>

        <h2 className="mb-2 text-2xl font-bold text-foreground">
          Your Trial Has Ended
        </h2>

        {totalUses > 0 && (
          <div className="mb-6 rounded-lg bg-muted/50 p-4 text-left">
            <p className="mb-3 text-sm text-muted-foreground">
              In 7 days, you used DevForge AI:
            </p>
            <ul className="space-y-1">
              {topTools.map((tool) => (
                <li key={tool.toolId} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{tool.toolName}</span>
                  <span className="text-muted-foreground">
                    {tool.count} time{tool.count !== 1 ? 's' : ''}
                  </span>
                </li>
              ))}
              {entryCount > 4 && (
                <li className="text-sm text-muted-foreground">
                  + {entryCount - 4} other tools
                </li>
              )}
            </ul>
          </div>
        )}

        <p className="mb-2 text-lg font-semibold text-foreground">
          Keep all 30+ tools forever for just $9.99
        </p>
        <p className="mb-6 text-sm text-muted-foreground">
          That&apos;s less than one month of most developer tools
        </p>

        <Button
          size="lg"
          className="w-full text-base"
          onClick={() => upgrade()}
        >
          Upgrade Now — $9.99 Lifetime
        </Button>

        <p className="mt-4 text-xs text-muted-foreground">
          One payment. Lifetime updates. No tricks.
        </p>
      </div>
    </div>
  )
}
