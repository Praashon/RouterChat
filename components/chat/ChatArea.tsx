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
    const permanentRules = `ABSOLUTE RULES YOU MUST FOLLOW IN EVERY SINGLE RESPONSE:
1. NEVER use em dashes (the long dash character). Do not use the "—" character anywhere. Use commas, periods, semicolons, colons, or parentheses instead. This is non-negotiable.
2. NEVER use emojis or emoji characters unless the user explicitly asks for them.
3. Use hyphens (-) only for compound words like "well-known". Never use long dashes.
These rules override all other instructions. Violating them is unacceptable.`
    
    const systemPayload = [{ role: "system" as const, content: baseSystem + permanentRules }]

    const historyPayload = activeChat.messages.map(m => ({ role: m.role, content: m.content }))
    const newPayload = { role: "user" as const, content }
    const messages = [...systemPayload, ...historyPayload, newPayload]

    setIsGenerating(true)
    
    // Fallback for crypto in older browsers, but crypto.randomUUID is standard in modern browsers
    const tempId = crypto.randomUUID()
    addMessage(activeChat.id, { id: tempId, role: "assistant", content: "" })

    let accumulated = ""

    // Helper: classify OpenRouter errors into actionable categories
    const classifyError = (err: any): { type: 'rate_limit' | 'no_endpoints' | 'auth' | 'abort' | 'unknown', message: string } => {
      if (err.name === 'AbortError') return { type: 'abort', message: '' }
      const msg = (err.message || '').toLowerCase()
      const status = err.status || err.statusCode || 0

      if (status === 429 || msg.includes('429') || msg.includes('rate limit') || msg.includes('too many') || msg.includes('no endpoints') || msg.includes('no available')) {
        return { type: 'rate_limit', message: err.message }
      }
      if (msg.includes('guardrail')) {
        return { type: 'no_endpoints', message: err.message }
      }
      if (status === 401 || msg.includes('401') || msg.includes('api key') || msg.includes('unauthorized')) {
        return { type: 'auth', message: err.message }
      }
      return { type: 'unknown', message: err.message || 'An unexpected error occurred.' }
    }

    // Fallback models for 429 rate limits ONLY
    const fallbackModels = [
      "google/gemini-2.5-flash:free",
      "meta-llama/llama-3.3-70b-instruct:free",
      "mistralai/mistral-small-3.1-24b-instruct:free"
    ].filter(m => m !== activeChat.model)

    try {
      const openai = createOpenAIClient(apiKey)
      const controller = new AbortController()
      abortControllerRef.current = controller

      // Attempt primary model first
      const attemptStream = async (modelId: string) => {
        const stream = await openai.chat.completions.create({
          model: modelId,
          messages: messages as any,
          stream: true,
          temperature: activeChat.settings.temperature,
          top_p: activeChat.settings.top_p,
          frequency_penalty: activeChat.settings.frequency_penalty,
          presence_penalty: activeChat.settings.presence_penalty,
        }, { signal: controller.signal })

        let lastUpdateTime = Date.now()
        accumulated = ""

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || ""
          if (text) {
            accumulated += text
            const now = Date.now()
            if (now - lastUpdateTime > 35) {
              updateMessage(activeChat.id, tempId, accumulated + " \u258d")
              lastUpdateTime = now
            }
          }
        }

        updateMessage(activeChat.id, tempId, accumulated)
      }

      try {
        await attemptStream(activeChat.model)
      } catch (primaryErr: any) {
        const classified = classifyError(primaryErr)

        // Abort: bubble immediately
        if (classified.type === 'abort') throw primaryErr

        // Auth: stop immediately, no retry
        if (classified.type === 'auth') {
          updateMessage(activeChat.id, tempId, `**Authentication Error**\n\nYour API key is invalid or expired. Please update it by clicking the "API Key" button in the top right corner.`)
          return
        }

        // No endpoints: this is an account-level guardrail issue, retrying won't help
        if (classified.type === 'no_endpoints') {
          updateMessage(activeChat.id, tempId, `**Request Blocked**\n\nOpenRouter cannot process this request due to your account's privacy or safety settings.\n\n**How to fix this:**\n1. Go to [openrouter.ai/settings/privacy](https://openrouter.ai/settings/privacy)\n2. Ensure all 3 **"Enable free endpoints..."** toggles are switched **ON**.\n3. Come back and try again.`)
          return
        }

        // Rate limit (429): try fallbacks
        if (classified.type === 'rate_limit') {
          let fallbackSuccess = false
          for (const fallbackModel of fallbackModels) {
            try {
              updateMessage(activeChat.id, tempId, `*Rate limited. Trying ${fallbackModel.split('/')[1]}...*`)
              await attemptStream(fallbackModel)
              fallbackSuccess = true
              break
            } catch (fallbackErr: any) {
              const fbClassified = classifyError(fallbackErr)
              if (fbClassified.type === 'abort') throw fallbackErr
              if (fbClassified.type === 'no_endpoints') {
                updateMessage(activeChat.id, tempId, `**Request Blocked**\n\nOpenRouter cannot route to any provider. Please visit [openrouter.ai/settings/privacy](https://openrouter.ai/settings/privacy) and verify your **"Enable free endpoints"** toggles are ON.`)
                return
              }
              // Continue trying next fallback on rate_limit or unknown
            }
          }
          if (!fallbackSuccess) {
            updateMessage(activeChat.id, tempId, `**All Models Rate Limited**\n\nThe selected model and all fallback models are currently overloaded. Please wait 15-30 seconds and try again.`)
          }
          return
        }

        // Unknown error
        updateMessage(activeChat.id, tempId, `**Something went wrong**\n\n${classified.message}\n\nPlease try again or switch to a different model.`)
        return
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        updateMessage(activeChat.id, tempId, accumulated)
      } else {
        updateMessage(activeChat.id, tempId, `**Unexpected Error**\n\n${err.message || 'An unknown error occurred.'}\n\nPlease try again.`)
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
        <h2 className="text-2xl font-medium tracking-tight text-foreground mb-2">Welcome to RouterChat</h2>
        <p className="text-muted-foreground text-[15px] max-w-sm leading-relaxed mb-8">
          Your premium AI chat interface powered by OpenRouter.
        </p>

        <WelcomeGuide />
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
          {!apiKey && (
            <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <WelcomeGuide />
            </div>
          )}
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

function WelcomeGuide() {
  return (
    <div className="w-full max-w-md space-y-3 text-left">
      <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-border/40">
        <div className="w-7 h-7 rounded-lg bg-zinc-200/80 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 text-[13px] font-semibold text-foreground">1</div>
        <div>
          <p className="text-[14px] font-medium text-foreground">Get your free API key</p>
          <p className="text-[13px] text-muted-foreground mt-0.5">Visit <a href="https://openrouter.ai/keys" target="_blank" className="underline underline-offset-2 hover:text-foreground transition-colors">openrouter.ai/keys</a> and create one.</p>
        </div>
      </div>
      <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-border/40">
        <div className="w-7 h-7 rounded-lg bg-zinc-200/80 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 text-[13px] font-semibold text-foreground">2</div>
        <div>
          <p className="text-[14px] font-medium text-foreground">Enable all free endpoints</p>
          <p className="text-[13px] text-muted-foreground mt-0.5">Go to <a href="https://openrouter.ai/settings/privacy" target="_blank" className="underline underline-offset-2 hover:text-foreground transition-colors">openrouter.ai/settings/privacy</a> and turn ON the 3 free endpoint toggles.</p>
        </div>
      </div>
      <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-border/40">
        <div className="w-7 h-7 rounded-lg bg-zinc-200/80 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 text-[13px] font-semibold text-foreground">3</div>
        <div>
          <p className="text-[14px] font-medium text-foreground">Paste your key here</p>
          <p className="text-[13px] text-muted-foreground mt-0.5">Click the "API Key" button in the top right corner and paste it in.</p>
        </div>
      </div>
      <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-border/40">
        <div className="w-7 h-7 rounded-lg bg-zinc-200/80 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 text-[13px] font-semibold text-foreground">4</div>
        <div>
          <p className="text-[14px] font-medium text-foreground">Start chatting</p>
          <p className="text-[13px] text-muted-foreground mt-0.5">Type a message below to start your first conversation.</p>
        </div>
      </div>
    </div>
  )
}
