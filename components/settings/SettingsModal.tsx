"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Settings, User, Bot, MessageSquareText } from "lucide-react"

export function SettingsModal({ children }: { children: React.ReactNode }) {
  const { 
    userName, 
    assistantName, 
    defaultSystemPrompt, 
    setUserName, 
    setAssistantName, 
    setDefaultSystemPrompt 
  } = useAppStore()

  const [isOpen, setIsOpen] = useState(false)

  // Local state to prevent saving on every keystroke
  const [localUser, setLocalUser] = useState(userName)
  const [localBot, setLocalBot] = useState(assistantName)
  const [localPrompt, setLocalPrompt] = useState(defaultSystemPrompt)

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setLocalUser(userName)
      setLocalBot(assistantName)
      setLocalPrompt(defaultSystemPrompt)
    }
    setIsOpen(open)
  }

  const handleSave = () => {
    setUserName(localUser || "User")
    setAssistantName(localBot || "Assistant")
    setDefaultSystemPrompt(localPrompt)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <div onClick={() => handleOpenChange(true)} className="w-full">
        {children}
      </div>

      <DialogContent className="max-w-[95vw] sm:max-w-[425px] max-h-[90vh] rounded-2xl border-zinc-200/40 dark:border-zinc-800/40 shadow-xl bg-background/95 backdrop-blur-xl gap-0 p-0 overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border/40 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3 sm:mb-4 border border-border/50">
            <Settings className="w-5 h-5 text-foreground" />
          </div>
          <DialogTitle className="text-lg sm:text-xl font-medium tracking-tight mb-1 text-foreground">
            Personalization
          </DialogTitle>
          <DialogDescription className="text-[13px] sm:text-[14px] text-muted-foreground leading-relaxed">
            Customize your experience and set default behaviors for new chats.
          </DialogDescription>
        </div>

        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 bg-zinc-50/30 dark:bg-zinc-900/10 overflow-y-auto flex-1 min-h-0">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="text-[13px] font-medium tracking-tight text-foreground block mb-1">Your Name</label>
                <Input 
                  value={localUser}
                  onChange={e => setLocalUser(e.target.value)}
                  className="rounded-xl bg-background border-zinc-200/60 dark:border-zinc-800/60 shadow-sm"
                  placeholder="e.g. Alex"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Bot className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="text-[13px] font-medium tracking-tight text-foreground block mb-1">Assistant Name</label>
                <Input 
                  value={localBot}
                  onChange={e => setLocalBot(e.target.value)}
                  className="rounded-xl bg-background border-zinc-200/60 dark:border-zinc-800/60 shadow-sm"
                  placeholder="e.g. RouterChat"
                />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MessageSquareText className="w-4 h-4 text-muted-foreground mt-2 shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="text-[13px] font-medium tracking-tight text-foreground block mb-1">Default System Prompt</label>
                <Textarea 
                  value={localPrompt}
                  onChange={e => setLocalPrompt(e.target.value)}
                  className="min-h-[100px] max-h-[30vh] resize-none rounded-xl bg-background border-zinc-200/60 dark:border-zinc-800/60 shadow-sm text-[14px] leading-relaxed"
                  placeholder="e.g. You are a helpful assistant that answers concisely."
                />
                <p className="text-[11px] text-muted-foreground mt-2 font-medium tracking-tight">
                  Applied automatically to all newly created chats.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-zinc-50/50 dark:bg-zinc-900/20 border-t border-border/40 flex justify-end gap-2 shrink-0">
          <Button 
            variant="ghost" 
            onClick={() => setIsOpen(false)}
            className="rounded-xl h-9 sm:h-10 font-medium tracking-tight text-muted-foreground hover:text-foreground hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 text-[13px] sm:text-[14px]"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="rounded-xl h-9 sm:h-10 px-5 sm:px-6 font-medium tracking-tight shadow-sm text-[13px] sm:text-[14px]"
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
