import { FileQuestion } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-border/40 flex items-center justify-center">
          <FileQuestion className="w-7 h-7 text-zinc-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight text-foreground font-heading">
            Page not found
          </h1>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center h-10 px-6 rounded-xl bg-foreground text-background text-[14px] font-medium hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Back to RouterChat
        </Link>
      </div>
    </div>
  )
}
