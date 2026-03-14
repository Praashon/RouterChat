export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-zinc-200 dark:border-zinc-700 border-t-zinc-800 dark:border-t-zinc-200 rounded-full animate-spin" />
        <p className="text-[14px] text-muted-foreground font-medium tracking-tight">Loading...</p>
      </div>
    </div>
  )
}
