"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useAppStore } from "@/lib/store"
import { OpenRouterModel, fetchOpenRouterModels } from "@/lib/openrouter"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// Using native overflow + scrollbar-thin CSS for reliable scrollbar
import { MessageSquarePlus, SearchIcon, Sparkles, Check, Zap, Loader2, ChevronDown, ChevronUp } from "lucide-react"

function isFreeModel(m: OpenRouterModel): boolean {
  return m.id.endsWith(":free") || m.pricing?.prompt === "0"
}

function formatNumber(num: number): string {
  if (!num) return "?"
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(num >= 10_000_000 ? 0 : 1) + "M"
  if (num >= 1_000) return Math.floor(num / 1_000) + "K"
  return num.toString()
}

export function NewChatDialog({ children }: { children: React.ReactNode }) {
  const { apiKey, chats, createChat, setCachedFreeModelIds, setCachedModelNames, cachedModelNames } = useAppStore()
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [models, setModels] = useState<OpenRouterModel[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [showModelPicker, setShowModelPicker] = useState(false)

  // Fetch models fresh every time dialog opens
  const fetchModels = useCallback(async () => {
    if (!apiKey) return
    setLoading(true)
    try {
      const data = await fetchOpenRouterModels(apiKey)
      setModels(data)
      // Update shared cache for fallback usage
      const freeIds = data.filter(m => isFreeModel(m)).map(m => m.id)
      setCachedFreeModelIds(freeIds)
      const nameMap: Record<string, string> = {}
      data.forEach(m => { nameMap[m.id] = m.name })
      setCachedModelNames(nameMap)
    } catch {
      // Silently fail - user can still type a model ID manually
    } finally {
      setLoading(false)
    }
  }, [apiKey, setCachedFreeModelIds, setCachedModelNames])

  useEffect(() => {
    if (isOpen) {
      setTitle("")
      setSearch("")
      setShowModelPicker(false)
      // Default to last used model
      const lastModel = chats.length > 0 ? chats[0].model : "google/gemini-2.5-flash:free"
      setSelectedModel(lastModel)
      if (apiKey) fetchModels()
    }
  }, [isOpen, apiKey, chats, fetchModels])

  const filteredModels = useMemo(() => {
    const s = search.toLowerCase().trim()
    if (!s) return models
    return models.filter(m =>
      m.name.toLowerCase().includes(s) || m.id.toLowerCase().includes(s)
    )
  }, [models, search])

  const freeModels = useMemo(() => filteredModels.filter(isFreeModel), [filteredModels])
  const paidModels = useMemo(() => filteredModels.filter(m => !isFreeModel(m)), [filteredModels])

  const selectedModelData = models.find(m => m.id === selectedModel)
  const selectedLabel = selectedModelData?.name || cachedModelNames[selectedModel] || selectedModel.split("/").pop()?.replace(":free", "") || "Select a model"

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
  }

  const handleCreate = () => {
    const model = selectedModel || "google/gemini-2.5-flash:free"
    createChat(model, undefined, title.trim() || undefined)
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !showModelPicker) {
      e.preventDefault()
      handleCreate()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <div onClick={() => handleOpenChange(true)} className="w-full">
        {children}
      </div>

      <DialogContent className="max-w-[95vw] sm:max-w-[480px] rounded-2xl border-zinc-200/40 dark:border-zinc-800/40 shadow-xl bg-background/95 backdrop-blur-xl gap-0 p-0 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-5 sm:p-6 pb-4 border-b border-border/40 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 border border-border/50">
            <MessageSquarePlus className="w-5 h-5 text-foreground" />
          </div>
          <DialogTitle className="text-xl font-medium tracking-tight mb-1 text-foreground">
            New Conversation
          </DialogTitle>
          <DialogDescription className="text-[14px] text-muted-foreground leading-relaxed">
            Choose a model and give your chat a name.
          </DialogDescription>
        </div>

        <div className="p-5 sm:p-6 bg-zinc-50/30 dark:bg-zinc-900/10 space-y-4 overflow-y-auto flex-1">
          {/* Chat name */}
          <div>
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

          {/* Model selector */}
          <div>
            <label className="text-[13px] font-medium tracking-tight text-foreground block mb-2">
              Model
            </label>

            <button
              type="button"
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="w-full flex items-center justify-between h-11 px-3.5 rounded-xl bg-background border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm text-left transition-colors hover:border-zinc-300 dark:hover:border-zinc-700"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[14px] font-medium tracking-tight truncate text-foreground">
                  {selectedLabel}
                </span>
                {selectedModelData && isFreeModel(selectedModelData) && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold tracking-wide shrink-0 uppercase">
                    Free
                  </span>
                )}
              </div>
              {showModelPicker ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
            </button>

            {/* Expandable model picker */}
            {showModelPicker && (
              <div className="mt-2 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-background overflow-hidden">
                <div className="p-2 border-b border-border/40">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search models..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="h-9 pl-8 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200/40 dark:border-zinc-800/40 text-[13px]"
                    />
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto scrollbar-thin">
                  {loading ? (
                    <div className="h-24 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
                      <Loader2 className="w-4 h-4 animate-spin opacity-50" />
                      <span>Loading models...</span>
                    </div>
                  ) : models.length === 0 ? (
                    <div className="h-24 flex items-center justify-center text-muted-foreground text-xs">
                      {apiKey ? "No models available" : "Set your API key first"}
                    </div>
                  ) : filteredModels.length === 0 ? (
                    <div className="h-24 flex items-center justify-center text-muted-foreground text-xs">
                      No models match &quot;{search}&quot;
                    </div>
                  ) : (
                    <div className="p-1.5 space-y-3">
                      {freeModels.length > 0 && (
                        <div>
                          <h4 className="px-2 text-[10px] font-semibold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1 py-1">
                            <Sparkles className="w-3 h-3" /> Free ({freeModels.length})
                          </h4>
                          <div className="space-y-0.5">
                            {freeModels.map(m => (
                              <MiniModelRow
                                key={m.id}
                                model={m}
                                isSelected={selectedModel === m.id}
                                onSelect={() => {
                                  setSelectedModel(m.id)
                                  setShowModelPicker(false)
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {paidModels.length > 0 && (
                        <div>
                          <h4 className="px-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase py-1 border-t border-border/40 mt-1 pt-2">
                            Paid ({paidModels.length})
                          </h4>
                          <div className="space-y-0.5">
                            {paidModels.map(m => (
                              <MiniModelRow
                                key={m.id}
                                model={m}
                                isSelected={selectedModel === m.id}
                                onSelect={() => {
                                  setSelectedModel(m.id)
                                  setShowModelPicker(false)
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/20 border-t border-border/40 flex justify-end gap-2 shrink-0">
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

function MiniModelRow({
  model,
  isSelected,
  onSelect,
}: {
  model: OpenRouterModel
  isSelected: boolean
  onSelect: () => void
}) {
  const free = isFreeModel(model)
  const provider = model.id.split("/")[0]

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
        isSelected
          ? "bg-zinc-100 dark:bg-zinc-800"
          : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
      }`}
    >
      <div className="flex flex-col gap-0.5 min-w-0 pr-2">
        <span className="font-medium text-[13px] tracking-tight truncate text-foreground">
          {model.name}
        </span>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="truncate max-w-24">{provider}</span>
          <span className="flex items-center gap-0.5">
            <Zap className="w-2.5 h-2.5" /> {formatNumber(model.context_length)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {free && (
          <span className="text-[9px] font-semibold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">Free</span>
        )}
        {isSelected && <Check className="w-3.5 h-3.5 text-foreground" />}
      </div>
    </button>
  )
}
