"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Bot, ArrowRight } from "lucide-react"

export function WelcomeModal() {
  const { hasCompletedSetup, setUserName, setAssistantName, setHasCompletedSetup } = useAppStore()
  const [localUser, setLocalUser] = useState("")
  const [localBot, setLocalBot] = useState("")

  const handleContinue = () => {
    setUserName(localUser.trim() || "User")
    setAssistantName(localBot.trim() || "Assistant")
    setHasCompletedSetup(true)
  }

  if (hasCompletedSetup) return null

  return (
    <Dialog open={!hasCompletedSetup} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-[95vw] sm:max-w-md rounded-2xl border-zinc-200/40 dark:border-zinc-800/40 shadow-xl bg-background/95 backdrop-blur-xl p-0 overflow-hidden [&>button]:hidden"
      >
        <div className="p-6 sm:p-8 pb-2 sm:pb-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">RC</span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-semibold tracking-tight mb-1.5 text-foreground">
            Welcome to RouterChat
          </DialogTitle>
          <DialogDescription className="text-[13px] sm:text-[14px] text-muted-foreground leading-relaxed">
            Let&apos;s personalize your experience. What should we call you and your assistant?
          </DialogDescription>
        </div>

        <div className="px-6 sm:px-8 pb-2 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium tracking-tight text-foreground flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              Your Name
            </label>
            <Input
              value={localUser}
              onChange={e => setLocalUser(e.target.value)}
              className="rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200/60 dark:border-zinc-800/60 shadow-sm h-11"
              placeholder="e.g. Alex"
              autoFocus
              onKeyDown={e => e.key === "Enter" && handleContinue()}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium tracking-tight text-foreground flex items-center gap-2">
              <Bot className="w-3.5 h-3.5 text-muted-foreground" />
              Assistant Name
            </label>
            <Input
              value={localBot}
              onChange={e => setLocalBot(e.target.value)}
              className="rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200/60 dark:border-zinc-800/60 shadow-sm h-11"
              placeholder="e.g. RouterChat"
              onKeyDown={e => e.key === "Enter" && handleContinue()}
            />
          </div>
        </div>

        <div className="p-6 sm:p-8 pt-4 sm:pt-5">
          <Button
            onClick={handleContinue}
            className="w-full rounded-xl h-11 font-medium tracking-tight shadow-sm text-[14px] gap-2"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-[11px] text-muted-foreground text-center mt-3 tracking-tight">
            You can change these anytime in Settings.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
