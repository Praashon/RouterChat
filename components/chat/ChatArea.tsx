"use client"

import { useAppStore } from "@/lib/store"
import { MessageBubble } from "@/components/chat/MessageBubble"
import { ChatInput } from "@/components/chat/ChatInput"
import { useEffect, useRef, useState } from "react"
import { createOpenAIClient } from "@/lib/openrouter"
import { BotIcon, MessageSquareIcon } from "lucide-react"

export function ChatArea() {
  const { apiKey, chats, activeChatId, addMessage, updateMessage } = useAppStore()
  const activeChat = chats.find(c => c.id === activeChatId)
  const [isGenerating, setIsGenerating] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [activeChat?.messages])

  const handleSend = async (content: string) => {
    if (!activeChat || !apiKey) return

    addMessage(activeChat.id, { role: "user", content })

    const baseSystem = activeChat.systemPrompt ? activeChat.systemPrompt + "\n\n" : ""
    const permanentRules = "CRUCIAL AND CRITICAL: DO NOT GIVE ANSWERS WITH EMDASHES. DO NOT GIVE ANSWERS WITH EMOJIS. If user explicitly asks for them, then only give them."
    
    const systemPayload = [{ role: "system" as const, content: baseSystem + permanentRules }]

    const historyPayload = activeChat.messages.map(m => ({ role: m.role, content: m.content }))
    const newPayload = { role: "user" as const, content }
    const messages = [...systemPayload, ...historyPayload, newPayload]

    setIsGenerating(true)
    
    // Fallback for crypto in older browsers, but crypto.randomUUID is standard in modern browsers
    const tempId = crypto.randomUUID()
    addMessage(activeChat.id, { id: tempId, role: "assistant", content: "" })

    let accumulated = ""

    try {
      const openai = createOpenAIClient(apiKey)
      const controller = new AbortController()
      abortControllerRef.current = controller

      const stream = await openai.chat.completions.create({
        model: activeChat.model,
        messages: messages as any,
        stream: true,
        temperature: activeChat.settings.temperature,
        top_p: activeChat.settings.top_p,
        frequency_penalty: activeChat.settings.frequency_penalty,
        presence_penalty: activeChat.settings.presence_penalty,
      }, { signal: controller.signal })

      let lastUpdateTime = Date.now()

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || ""
        if (text) {
          accumulated += text
          const now = Date.now()
          if (now - lastUpdateTime > 35) { // Throttle ~28 FPS to keep main thread fast
            updateMessage(activeChat.id, tempId, accumulated + " ▍")
            lastUpdateTime = now
          }
        }
      }
      
      // Flush final text completely without cursor
      updateMessage(activeChat.id, tempId, accumulated)
    } catch (err: any) {
      if (err.name === 'AbortError') {
        updateMessage(activeChat.id, tempId, accumulated)
      } else {
        let errorMsg = err.message || "An error occurred during generation."
        
        // Make OpenRouter raw errors look beautiful
        if (errorMsg.includes("429")) {
          errorMsg = "This free model is currently overloaded with requests. Please try again in a moment, or switch to a different model in the selector."
        } else if (errorMsg.includes("404")) {
          errorMsg = "Your OpenRouter guardrail settings or data privacy policy blocked this request. Please check your OpenRouter account settings."
        } else if (errorMsg.includes("401")) {
          errorMsg = "Invalid API Key. Please verify your OpenRouter API key in settings."
        }

        updateMessage(activeChat.id, tempId, `**Connection Error:**\n${errorMsg}`)
      }
    } finally {
      setIsGenerating(false)
      abortControllerRef.current = null
    }
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsGenerating(false)
    }
  }

  if (!activeChatId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background">
        <div className="w-16 h-16 rounded-[1.25rem] bg-zinc-50 dark:bg-zinc-900 border border-border/40 flex items-center justify-center mb-6 shadow-[0_0_1px_1px_rgba(0,0,0,0.03)] dark:shadow-[0_0_1px_1px_rgba(255,255,255,0.03)]">
          <MessageSquareIcon className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
        </div>
        <h2 className="text-2xl font-medium tracking-tight text-foreground mb-2">RouterChat</h2>
        <p className="text-muted-foreground text-[15px] max-w-sm leading-relaxed mb-8">
          A premium desktop-class AI interface. Select a chat from the sidebar or start a new conversation.
        </p>
      </div>
    )
  }

  if (!activeChat) return null

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {activeChat.messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-border/40 shadow-sm flex items-center justify-center mb-6">
            <BotIcon className="w-8 h-8 text-zinc-500 dark:text-zinc-400" />
          </div>
          <h2 className="text-2xl font-medium tracking-tight text-foreground mb-3">How can I help you today?</h2>
          <p className="text-muted-foreground text-[15px] max-w-[280px] leading-relaxed mb-8 flex flex-col gap-1 items-center">
            <span className="opacity-70">Using model</span>
            <span className="font-medium text-foreground px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[13px] font-mono shadow-sm border border-border/50">
              {activeChat.model.split('/')[1] || activeChat.model}
            </span>
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto" ref={scrollRef}>
          <div className="pb-10 pt-4">
            {activeChat.messages.map((msg, idx) => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                isLast={idx === activeChat.messages.length - 1}
                isGenerating={isGenerating}
              />
            ))}
          </div>
        </div>
      )}

      <ChatInput onSend={handleSend} isGenerating={isGenerating} onStop={handleStop} />
    </div>
  )
}
