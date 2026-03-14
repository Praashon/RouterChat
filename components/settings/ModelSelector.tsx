"use client"

import { useState, useEffect, useMemo } from "react"
import { useAppStore } from "@/lib/store"
import { OpenRouterModel, fetchOpenRouterModels } from "@/lib/openrouter"
import { Dialog, DialogContent, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SearchIcon, Sparkles, ChevronDown, Check, Coins, ExternalLink, Zap } from "lucide-react"

export function ModelSelector() {
  const { apiKey, chats, activeChatId, updateChatModel } = useAppStore()
  const activeChat = chats.find(c => c.id === activeChatId)
  
  const [isOpen, setIsOpen] = useState(false)
  const [models, setModels] = useState<OpenRouterModel[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  
  const [primaryFilter, setPrimaryFilter] = useState<"all" | "free" | "paid">("all")
  const [secondaryFilter, setSecondaryFilter] = useState<"default" | "latest" | "popular" | "used">("default")

  const [protectedModel, setProtectedModel] = useState<OpenRouterModel | null>(null)

  useEffect(() => {
    if (isOpen && apiKey && models.length === 0) {
      setLoading(true)
      fetchOpenRouterModels(apiKey)
        .then(data => setModels(data))
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [isOpen, apiKey, models.length])

  const filteredModels = useMemo(() => {
    const s = search.toLowerCase()
    return models.filter(m => m.name.toLowerCase().includes(s) || m.id.toLowerCase().includes(s))
  }, [models, search])

  const groupedModels = useMemo(() => {
    let result = [...filteredModels];
    
    // Apply Primary Filters
    if (primaryFilter === 'free') {
      result = result.filter(m => m.id.endsWith(':free') || m.pricing?.prompt === "0");
    } else if (primaryFilter === 'paid') {
      result = result.filter(m => !(m.id.endsWith(':free') || m.pricing?.prompt === "0"));
    }

    // Apply Secondary Filters
    if (secondaryFilter === 'latest') {
      // Sort by created timestamp descending
      result = result.sort((a, b) => (b.created || 0) - (a.created || 0));
    } else if (secondaryFilter === 'popular') {
      // Top providers roughly
      const popularProviders = ['anthropic', 'openai', 'google', 'meta-llama', 'mistralai'];
      result = result.filter(m => popularProviders.some(p => m.id.includes(p)));
    } else if (secondaryFilter === 'used') {
      // Heuristic for "Mostly Used": Big context, famous models, non-experimental
      result = result.filter(m => {
        const id = m.id.toLowerCase();
        return (
          id.includes('claude-3.5-sonnet') || 
          id.includes('gpt-4o') || 
          id.includes('gemini-1.5') || 
          id.includes('llama-3.1') ||
          id.includes('llama-3.3')
        ) && !id.includes('experimental') && !id.includes('beta');
      });
    }

    // Split for rendering layout if 'all' is selected and 'default' is the sort
    if (primaryFilter === 'all' && secondaryFilter === 'default') {
      const free = result.filter(m => m.id.endsWith(':free') || m.pricing?.prompt === "0")
      const paid = result.filter(m => !(m.id.endsWith(':free') || m.pricing?.prompt === "0"))
      return { free, paid, singleList: null }
    }

    // If anything else is selected, flatten the view into a single list
    return { free: [], paid: [], singleList: result }
  }, [filteredModels, primaryFilter, secondaryFilter])

  const handleSelect = (model: OpenRouterModel) => {
    const isFree = model.id.endsWith(':free') || model.pricing?.prompt === "0"
    if (!isFree) {
      setProtectedModel(model)
      return
    }

    if (activeChatId) {
      updateChatModel(activeChatId, model.id)
    }
    setIsOpen(false)
  }

  const handleForcePaidSelect = (model: OpenRouterModel) => {
    if (activeChatId) updateChatModel(activeChatId, model.id)
    setProtectedModel(null)
    setIsOpen(false)
  }

  const currentModelName = models.find(m => m.id === activeChat?.model)?.name || activeChat?.model || "Select Model"

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) setProtectedModel(null)
        setIsOpen(open)
      }}>
        <DialogTrigger 
          render={
            <Button variant="ghost" className="h-9 gap-2 rounded-xl text-foreground font-medium tracking-tight hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 pr-2 overflow-hidden shadow-none max-w-[200px] md:max-w-xs justify-start" />
          }
        >
          <span className="truncate">{currentModelName}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto flex-shrink-0" />
        </DialogTrigger>

        <DialogContent className="sm:max-w-2xl rounded-2xl border-zinc-200/40 dark:border-zinc-800/40 shadow-2xl bg-background/95 backdrop-blur-xl gap-0 p-0 overflow-hidden h-[80vh] flex flex-col">
          {protectedModel ? (
            <div className="flex flex-col h-full items-center justify-center p-8 text-center bg-zinc-50/50 dark:bg-zinc-900/20">
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-border/40 shadow-sm flex items-center justify-center mb-6">
                <Coins className="w-8 h-8 text-zinc-700 dark:text-zinc-300" />
              </div>
              <h2 className="text-2xl font-medium tracking-tight mb-3 text-foreground">Premium Model Selected</h2>
              <DialogDescription className="text-muted-foreground text-[15px] leading-relaxed max-w-sm mb-8">
                {protectedModel.name} requires OpenRouter credits to use.
              </DialogDescription>
              
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button 
                  onClick={() => window.open('https://openrouter.ai/credits', '_blank')}
                  className="rounded-xl h-11 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-900 font-medium tracking-tight w-full justify-between px-5"
                >
                  Add Credits <ExternalLink className="w-4 h-4 opacity-50" />
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleForcePaidSelect(protectedModel)}
                  className="rounded-xl h-11 border-zinc-200 dark:border-zinc-800 font-medium tracking-tight w-full"
                >
                  I already have credits
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => setProtectedModel(null)}
                  className="rounded-xl h-11 text-muted-foreground hover:text-foreground font-medium w-full mt-2"
                >
                  Switch to Free Model
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-border/40 bg-zinc-50/50 dark:bg-zinc-900/20 flex flex-col gap-3">
                <div className="relative">
                  <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search thousands of models..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="h-11 pl-10 rounded-xl bg-background border-zinc-200/60 dark:border-zinc-800/60 focus-visible:ring-1 focus-visible:ring-zinc-400/50 shadow-sm text-[15px]"
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x mask-fade-r">
                    {['all', 'free', 'paid'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setPrimaryFilter(f as any)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide capitalize flex-shrink-0 transition-colors snap-start ${
                          primaryFilter === f 
                            ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 shadow-sm' 
                            : 'bg-zinc-200/50 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-400 dark:hover:bg-zinc-800 border border-transparent hover:border-border/50'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x mask-fade-r">
                    {['default', 'latest', 'popular', 'mostly used'].map((f) => {
                      const filterVal = f === 'mostly used' ? 'used' : f;
                      return (
                        <button
                          key={f}
                          onClick={() => setSecondaryFilter(filterVal as any)}
                          className={`px-3 py-1 rounded-md text-[11px] font-medium tracking-wide capitalize flex-shrink-0 transition-colors snap-start ${
                            secondaryFilter === filterVal 
                              ? 'bg-zinc-200/80 text-zinc-800 dark:bg-zinc-800 text-zinc-200' 
                              : 'text-zinc-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-foreground'
                          }`}
                        >
                          {f}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 p-2">
                {!apiKey ? (
                  <div className="h-40 flex items-center justify-center text-muted-foreground text-sm font-medium">
                    Configure your API key first to view models.
                  </div>
                ) : loading ? (
                  <div className="h-40 flex flex-col items-center justify-center text-muted-foreground text-sm font-medium gap-3">
                    <span className="animate-pulse">Loading OpenRouter models...</span>
                  </div>
                ) : (
                  <div className="p-2 space-y-6">
                    {/* Render specific list if tab is active */}
                    {groupedModels.singleList !== null ? (
                      <div className="space-y-1">
                        {groupedModels.singleList.map(model => (
                          <ModelRow 
                            key={model.id} 
                            model={model} 
                            isActive={activeChat?.model === model.id}
                            onSelect={() => handleSelect(model)}
                            isFree={model.id.endsWith(':free') || model.pricing?.prompt === "0"}
                          />
                        ))}
                      </div>
                    ) : (
                      <>
                        {groupedModels.free.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="px-3 text-[11px] font-medium tracking-wider text-muted-foreground uppercase flex items-center gap-1.5 pt-2">
                          <Sparkles className="w-3.5 h-3.5" /> Free Models
                        </h4>
                        <div className="space-y-1">
                          {groupedModels.free.map(model => (
                            <ModelRow 
                              key={model.id} 
                              model={model} 
                              isActive={activeChat?.model === model.id}
                              onSelect={() => handleSelect(model)}
                              isFree
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {groupedModels.paid.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="px-3 text-[11px] font-medium tracking-wider text-muted-foreground uppercase pt-4 border-t border-border/40">
                          Premium Models
                        </h4>
                        <div className="space-y-1">
                          {groupedModels.paid.map(model => (
                            <ModelRow 
                              key={model.id} 
                              model={model} 
                              isActive={activeChat?.model === model.id}
                              onSelect={() => handleSelect(model)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    </>
                    )}
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function ModelRow({ model, isActive, onSelect, isFree = false }: { model: OpenRouterModel, isActive: boolean, onSelect: () => void, isFree?: boolean }) {
  const formatTokens = (num: number) => {
    if (!num) return "?"
    if (num > 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num > 1000) return Math.floor(num / 1000) + 'K'
    return num.toString()
  }

  // Handle some edge cases in pricing response from OpenRouter
  const promptPrice = model.pricing?.prompt !== undefined ? Number(model.pricing.prompt) : null;

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all outline-none focus-visible:ring-1 focus-visible:ring-ring ${
        isActive 
          ? 'bg-zinc-100 dark:bg-zinc-800' 
          : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50 active:bg-zinc-100 dark:active:bg-zinc-800/80'
      }`}
    >
      <div className="flex flex-col gap-1 min-w-0 pr-4">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[14.5px] tracking-tight truncate text-foreground">
            {model.name}
          </span>
          {isFree && <Sparkles className="w-3 h-3 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="truncate max-w-[150px]">{model.id.split('/')[0]}</span>
          <span className="flex items-center gap-1 xl:opacity-70">
            <Zap className="w-3 h-3" /> {formatTokens(model.context_length)} ctx
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-3 flex-shrink-0 pl-2">
        {!isFree && promptPrice !== null && (
          <div className="text-right flex flex-col items-end gap-0.5 opacity-60">
            <span className="text-[10px] uppercase font-medium tracking-wider">Prompt / 1M</span>
            <span className="text-[13px] font-medium font-mono">${(promptPrice * 1000000).toFixed(2)}</span>
          </div>
        )}
        {isActive && (
          <div className="w-6 h-6 flex items-center justify-center ml-2 text-foreground">
            <Check className="w-4 h-4" />
          </div>
        )}
      </div>
    </button>
  )
}
