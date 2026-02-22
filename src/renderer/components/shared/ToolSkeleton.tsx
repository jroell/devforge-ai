export function ToolSkeleton() {
  return (
    <div className="flex h-full flex-col gap-3 p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-lg bg-muted" />
        <div className="flex flex-col gap-2">
          <div className="h-5 w-40 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-8 w-24 rounded bg-muted" />
        <div className="h-8 w-24 rounded bg-muted" />
        <div className="h-8 w-20 rounded bg-muted" />
      </div>
      <div className="grid flex-1 grid-cols-2 gap-3">
        <div className="rounded-md border border-border bg-muted/30" />
        <div className="rounded-md border border-border bg-muted/30" />
      </div>
    </div>
  )
}
