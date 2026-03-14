"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { fetchOpenRouterModels } from "@/lib/openrouter"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { KeyIcon, CheckCircle2, Loader2, ArrowRight } from "lucide-react"

export function ApiKeyModal() {
  const { apiKey, setApiKey } = useAppStore()
  const [isOpen, setIsOpen] = useState(false)
  const [inputKey, setInputKey] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  
  useEffect(() => {
    if (isOpen) {
      setInputKey(apiKey)
      setValidationError(null)
    }
  }, [isOpen, apiKey])

  const handleSave = async () => {
    if (!inputKey.trim()) {
      setApiKey("")
      setIsOpen(false)
      return
    }

    setIsValidating(true)
    setValidationError(null)
    
    try {
      await fetchOpenRouterModels(inputKey)
      setApiKey(inputKey)
      setIsOpen(false)
    } catch (err) {
      setValidationError("Invalid API key or network error.")
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="h-9 gap-2 rounded-xl border-border/40 text-muted-foreground hover:text-foreground hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors shadow-none" />
        }
      >
        <KeyIcon className="w-4 h-4" />
        <span className="font-medium tracking-tight">API Key</span>
        {apiKey && <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md rounded-2xl border-zinc-200/40 dark:border-zinc-800/40 shadow-xl bg-background/95 backdrop-blur-xl gap-0 p-0 overflow-hidden">
        <div className="p-6 pb-4 border-b border-border/40 bg-zinc-50/50 dark:bg-zinc-900/20">
          <DialogTitle className="text-lg tracking-tight font-medium flex items-center gap-3 text-foreground">
            <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border-border/40 shadow-sm flex items-center justify-center">
              <KeyIcon className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            </div>
            OpenRouter Key
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-3 text-[13px] leading-relaxed">
            Your key is stored securely in your browser's local storage. We do not transmit or store your key on any external servers.
          </DialogDescription>
        </div>

        <div className="p-6 space-y-4 bg-background">
          <div className="space-y-2">
            <Input 
              type="password" 
              placeholder="sk-or-v1-..."
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value)
                setValidationError(null)
              }}
              className="h-11 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200/60 dark:border-zinc-800/60 focus-visible:ring-1 focus-visible:ring-zinc-400/50 text-sm shadow-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave()
              }}
            />
          </div>

          {validationError && (
             <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 text-sm font-medium text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 flex-shrink-0" />
                {validationError}
             </div>
          )}

          <div className="rounded-xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-border/40 p-4 space-y-3">
            <p className="text-[12px] font-semibold tracking-wider uppercase text-muted-foreground">Quick Setup Guide</p>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-zinc-200/80 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 text-[11px] font-semibold text-foreground mt-0.5">1</span>
                <p className="text-[13px] text-muted-foreground leading-snug">Create a free key at <a href="https://openrouter.ai/keys" target="_blank" className="underline underline-offset-2 hover:text-foreground transition-colors">openrouter.ai/keys</a></p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-zinc-200/80 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 text-[11px] font-semibold text-foreground mt-0.5">2</span>
                <p className="text-[13px] text-muted-foreground leading-snug">Visit <a href="https://openrouter.ai/settings/privacy" target="_blank" className="underline underline-offset-2 hover:text-foreground transition-colors">openrouter.ai/settings/privacy</a> and set Data Policy to "Allow all providers"</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-zinc-200/80 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 text-[11px] font-semibold text-foreground mt-0.5">3</span>
                <p className="text-[13px] text-muted-foreground leading-snug">Paste your key above and click Save Key</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 px-6 border-t border-border/40 bg-zinc-50/50 dark:bg-zinc-900/20">
          <Button 
            variant="ghost" 
            className="text-muted-foreground hover:text-foreground text-[13px] font-medium -ml-3 h-8"
            onClick={() => window.open('https://openrouter.ai/keys', '_blank')}
          >
            Get a key <ArrowRight className="w-3 h-3 ml-1.5 opacity-50" />
          </Button>

          <div className="flex items-center gap-2">
            {apiKey && (
              <Button 
                variant="ghost" 
                onClick={() => {
                  setApiKey("")
                  setInputKey("")
                }}
                className="text-muted-foreground hover:text-foreground font-medium text-sm h-9 rounded-xl"
              >
                Clear
              </Button>
            )}
            <Button 
              onClick={handleSave} 
              disabled={isValidating || (!inputKey && !apiKey)}
              className="rounded-xl px-5 h-9 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-900 font-medium tracking-tight shadow-sm"
            >
              {isValidating ? (
                <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Validating</>
              ) : (
                "Save Key"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
