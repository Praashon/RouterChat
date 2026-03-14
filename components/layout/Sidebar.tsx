"use client"

import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { PlusIcon, MessageSquare, Trash2, Edit3, Settings } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SettingsModal } from "@/components/settings/SettingsModal"
import { useState } from "react"
import { clsx } from "clsx"

export function Sidebar({ isMobile = false }: { isMobile?: boolean }) {
  const { chats, activeChatId, createChat, setActiveChat, deleteChat, updateChatTitle } = useAppStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")

  const handleNewChat = () => {
    const lastModel = chats.length > 0 ? chats[0].model : "google/gemini-2.5-flash:free"
    createChat(lastModel)
  }

  return (
    <div className={clsx(
      "flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-900/20 border-r border-border/40",
      isMobile ? "w-full" : "w-[280px]"
    )}>
      <div className="p-4 flex items-center gap-2">
        <Button 
          onClick={handleNewChat} 
          className="w-full justify-start gap-2 h-10 rounded-xl bg-background border border-border/40 text-foreground hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 shadow-sm transition-all outline-none focus-visible:ring-1 focus-visible:ring-ring"
          variant="secondary"
        >
          <PlusIcon className="w-4 h-4 opacity-70" />
          <span className="font-medium tracking-tight">New Chat</span>
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1 pb-4">
          {chats.map(chat => (
            <div 
              key={chat.id} 
              className={clsx(
                "group relative flex items-center pr-2 rounded-xl transition-all cursor-pointer",
                activeChatId === chat.id 
                  ? "bg-zinc-100 dark:bg-zinc-800 text-foreground" 
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-muted-foreground hover:text-foreground"
              )}
            >
              <button
                className="flex-1 flex items-center gap-3 p-2.5 overflow-hidden text-left outline-none"
                onClick={() => setActiveChat(chat.id)}
              >
                <MessageSquare className="w-4 h-4 opacity-50 flex-shrink-0" />
                {editingId === chat.id ? (
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => {
                      if (editTitle.trim()) updateChatTitle(chat.id, editTitle)
                      setEditingId(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (editTitle.trim()) updateChatTitle(chat.id, editTitle)
                        setEditingId(null)
                      }
                      if (e.key === "Escape") setEditingId(null)
                    }}
                    className="flex-1 bg-transparent border-none outline-none text-[14px] font-medium tracking-tight h-5 shadow-none"
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span className="truncate text-[14.5px] font-medium tracking-tight pr-4">
                    {chat.title}
                  </span>
                )}
              </button>

              {activeChatId === chat.id && editingId !== chat.id && (
                <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity bg-gradient-to-l from-zinc-100 via-zinc-100 to-transparent dark:from-zinc-800 dark:via-zinc-800 pl-4 py-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditTitle(chat.title); setEditingId(chat.id); }}
                    className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700/50 text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                    className="p-1.5 rounded-md hover:bg-red-500/10 hover:text-red-500 text-muted-foreground transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {chats.length === 0 && (
            <div className="text-center py-10 px-4">
              <MessageSquare className="w-8 h-8 opacity-20 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No chats yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Start a new conversation to begin.</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border/40">
        <SettingsModal>
          <button className="w-full flex items-center gap-2.5 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors font-medium text-[14px] tracking-tight outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <Settings className="w-4 h-4 opacity-70" />
            Settings
          </button>
        </SettingsModal>
      </div>
    </div>
  )
}
