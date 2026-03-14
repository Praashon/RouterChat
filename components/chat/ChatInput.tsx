"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { SendIcon, Square } from "lucide-react"

interface ChatInputProps {
  onSend: (message: string) => void;
  isGenerating: boolean;
  onStop: () => void;
}

export function ChatInput({ onSend, isGenerating, onStop }: ChatInputProps) {
  const [input, setInput] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const resizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  useEffect(() => {
    resizeTextarea()
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isGenerating) {
        onSend(input.trim())
        setInput("")
      }
    }
  }

  return (
    <div className="p-2 sm:p-4 bg-background">
      <div className="max-w-3xl mx-auto relative flex items-end bg-zinc-50 dark:bg-zinc-900/50 rounded-xl sm:rounded-2xl border border-border/40 focus-within:ring-1 focus-within:ring-zinc-400/50 shadow-sm transition-shadow">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          className="w-full max-h-[200px] min-h-[48px] sm:min-h-[56px] py-3 sm:py-4 pl-3 sm:pl-4 pr-12 sm:pr-14 bg-transparent resize-none outline-none text-[14px] sm:text-[15px] placeholder:text-muted-foreground/70"
          rows={1}
        />
        
        <div className="absolute right-2 bottom-2">
          {isGenerating ? (
            <Button 
              size="icon" 
              onClick={onStop}
              className="h-10 w-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-900 shadow-sm"
            >
              <Square className="w-4 h-4 fill-current" />
            </Button>
          ) : (
            <Button 
              size="icon" 
              onClick={() => {
                if (input.trim()) {
                  onSend(input.trim())
                  setInput("")
                }
              }}
              disabled={!input.trim()}
              className="h-10 w-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-900 shadow-sm disabled:opacity-50 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-500"
            >
              <SendIcon className="w-4 h-4 ml-0.5" />
            </Button>
          )}
        </div>
      </div>
      <div className="max-w-3xl mx-auto text-center mt-2">
        <p className="text-[11.5px] text-muted-foreground/60 tracking-wider">
          AI models can make mistakes. Consider verifying important information.
        </p>
      </div>
    </div>
  )
}
