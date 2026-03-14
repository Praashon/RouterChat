"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquarePlus } from "lucide-react"

export function NewChatDialog({ children }: { children: React.ReactNode }) {
  const { chats, createChat } = useAppStore()
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState("")

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setTitle("")
    }
    setIsOpen(open)
  }

  const handleCreate = () => {
    const lastModel = chats.length > 0 ? chats[0].model : "google/gemini-2.5-flash:free"
    createChat(lastModel, undefined, title.trim() || undefined)
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleCreate()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <div onClick={() => handleOpenChange(true)} className="w-full">
        {children}
      </div>

      <DialogContent className="sm:max-w-[425px] rounded-2xl border-zinc-200/40 dark:border-zinc-800/40 shadow-xl bg-background/95 backdrop-blur-xl gap-0 p-0 overflow-hidden">
        <div className="p-6 pb-4 border-b border-border/40">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 border border-border/50">
            <MessageSquarePlus className="w-5 h-5 text-foreground" />
          </div>
          <DialogTitle className="text-xl font-medium tracking-tight mb-1 text-foreground">
            New Conversation
          </DialogTitle>
          <DialogDescription className="text-[14px] text-muted-foreground leading-relaxed">
            Give your new chat a distinct name to quickly find it later.
          </DialogDescription>
        </div>

        <div className="p-6 bg-zinc-50/30 dark:bg-zinc-900/10">
          <label className="text-[13px] font-medium tracking-tight text-foreground block mb-2">
            Chat Name
          </label>
          <Input 
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="rounded-xl h-11 bg-background border-zinc-200/60 dark:border-zinc-800/60 shadow-sm"
            placeholder="e.g. Next.js Routing Help"
          />
        </div>

        <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/20 border-t border-border/40 flex justify-end gap-2">
          <Button 
            variant="ghost" 
            onClick={() => setIsOpen(false)}
            className="rounded-xl h-10 font-medium tracking-tight text-muted-foreground hover:text-foreground hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreate}
            className="rounded-xl h-10 px-6 font-medium tracking-tight shadow-sm"
          >
            Start Chat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
