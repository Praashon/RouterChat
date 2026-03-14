"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { User, Bot, MessageSquareText, History, RotateCcw, Trash2 } from "lucide-react"

export function SettingsModal({ children }: { children: React.ReactNode }) {
  const { 
    userName, 
    assistantName, 
    defaultSystemPrompt, 
    setUserName, 
    setAssistantName, 
    setDefaultSystemPrompt,
    deletedChats,
    restoreChat,
    permanentlyDeleteChat
  } = useAppStore()

  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'history'>('general')

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

      <DialogContent className="max-w-[95vw] sm:max-w-xl max-h-[90vh] rounded-2xl border-zinc-200/40 dark:border-zinc-800/40 shadow-xl bg-background/95 backdrop-blur-xl gap-0 p-0 overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border/40 shrink-0">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex bg-zinc-100/80 dark:bg-zinc-800/80 p-1 rounded-xl w-full">
              <button 
                onClick={() => setActiveTab('general')}
                className={`flex-1 flex justify-center py-1.5 rounded-lg text-sm font-medium tracking-tight transition-all ${activeTab === 'general' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Personalization
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`flex-1 flex justify-center py-1.5 rounded-lg text-sm font-medium tracking-tight transition-all ${activeTab === 'history' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Trash History
              </button>
            </div>
          </div>
          {activeTab === 'general' ? (
            <>
              <DialogTitle className="text-lg sm:text-xl font-medium tracking-tight mb-1 text-foreground">
                Settings
              </DialogTitle>
              <DialogDescription className="text-[13px] sm:text-[14px] text-muted-foreground leading-relaxed">
                Customize your experience and set default behaviors for new chats.
              </DialogDescription>
            </>
          ) : (
            <>
              <DialogTitle className="text-lg sm:text-xl font-medium tracking-tight mb-1 text-foreground">
                Trash History
              </DialogTitle>
              <DialogDescription className="text-[13px] sm:text-[14px] text-muted-foreground leading-relaxed">
                Deleted chats are kept here for 30 days before being permanently removed.
              </DialogDescription>
            </>
          )}
        </div>

        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 bg-zinc-50/30 dark:bg-zinc-900/10 overflow-y-auto flex-1 min-h-[300px]">
          {activeTab === 'general' ? (
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
          ) : (
            <div className="space-y-2">
              {deletedChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
                  <History className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm font-medium tracking-tight">No deleted chats</p>
                </div>
              ) : (
                deletedChats.map(chat => {
                  const daysLeft = chat.deletedAt ? Math.max(0, 30 - Math.floor((Date.now() - chat.deletedAt) / (1000 * 60 * 60 * 24))) : 30;
                  return (
                    <div key={chat.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-background border border-border/40 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors group">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[14px] tracking-tight truncate text-foreground mb-0.5">{chat.title}</p>
                        <p className="text-[12px] text-muted-foreground flex items-center gap-1.5 tracking-tight">
                          <History className="w-3 h-3" />
                          Deletes permanently in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => restoreChat(chat.id)}
                          className="h-8 px-3 rounded-lg text-xs font-medium tracking-tight text-muted-foreground hover:text-foreground hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                          Restore
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => permanentlyDeleteChat(chat.id)}
                          className="h-8 px-3 rounded-lg text-xs font-medium tracking-tight text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4 bg-zinc-50/50 dark:bg-zinc-900/20 border-t border-border/40 flex justify-end gap-2 shrink-0">
          {activeTab === 'general' ? (
            <>
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
            </>
          ) : (
            <Button 
              onClick={() => setIsOpen(false)}
              className="rounded-xl h-9 sm:h-10 px-5 sm:px-6 font-medium tracking-tight shadow-sm text-[13px] sm:text-[14px]"
            >
              Done
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
