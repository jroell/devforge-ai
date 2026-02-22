import { useLicenseStore } from '@/stores/license'
import { cn } from '@/lib/utils'

export function TrialBanner() {
  const { status, daysRemaining, upgrade } = useLicenseStore()

  if (status === 'licensed' || status === 'loading' || status === 'unknown' || status === 'expired') {
    return null
  }

  const days = daysRemaining ?? 0

  let tierClass: string
  let message: string

  if (days >= 5) {
    tierClass = 'bg-muted/50 text-muted-foreground'
    message = `Trial: ${days} day${days !== 1 ? 's' : ''} remaining`
  } else if (days >= 3) {
    tierClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    message = `Trial: ${days} day${days !== 1 ? 's' : ''} left`
  } else {
    tierClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    message = days === 1
      ? 'Trial expires tomorrow \u2014 Don\u2019t lose access!'
      : 'Trial expires today!'
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between border-b px-4 py-1.5 text-xs',
        tierClass
      )}
    >
      <span>{message}</span>
      <button
        onClick={() => upgrade()}
        className={cn(
          'rounded px-3 py-0.5 text-xs font-medium transition',
          days >= 5
            ? 'text-muted-foreground hover:text-foreground'
            : days >= 3
              ? 'bg-blue-600 text-white hover:bg-blue-500'
              : 'bg-amber-600 text-white hover:bg-amber-500'
        )}
      >
        {days >= 5 ? 'Upgrade $9.99' : 'Upgrade Now \u2014 $9.99'}
      </button>
    </div>
  )
}
