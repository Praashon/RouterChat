"use client"

import { ChatMessage } from "@/lib/store"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { useTheme } from "next-themes"
import { CopyIcon, CheckIcon, UserIcon, BotIcon, RefreshCcw } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export function MessageBubble({ 
  message, 
  onRegenerate,
  isLast,
  isGenerating
}: { 
  message: ChatMessage; 
  onRegenerate?: () => void;
  isLast?: boolean;
  isGenerating?: boolean;
}) {
  const isUser = message.role === "user"

  // Only animate if it's the assistant's last message, and the content is actively streaming over time.
  const isStreaming = !isUser && isLast && isGenerating;

  return (
    <div className={`w-full py-6 flex px-4 md:px-6 ${isUser ? "bg-background" : "bg-zinc-50/50 dark:bg-zinc-900/20 border-y border-border/40"}`}>
      <div className="max-w-3xl mx-auto w-full flex gap-5">
        <div className="w-8 h-8 flex-shrink-0 mt-0.5 rounded-[10px] border border-border/60 flex items-center justify-center bg-background shadow-sm">
          {isUser ? <UserIcon className="w-4 h-4 opacity-70" /> : <BotIcon className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />}
        </div>
        
        <div className={`flex-1 min-w-0 prose prose-zinc dark:prose-invert max-w-none text-[15px] leading-relaxed tracking-tight prose-p:my-2 prose-pre:my-0 prose-pre:bg-transparent prose-pre:p-0 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-headings:font-semibold prose-headings:font-heading prose-headings:tracking-tight ${isStreaming ? 'animate-streaming-message' : ''}`}>
          {message.content === "" && isStreaming ? (
            <div className="flex gap-1.5 items-center h-[24px] mt-1 text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({node, inline, className, children, ...props}: any) {
                   const match = /language-(\w+)/.exec(className || '')
                   const codeString = String(children).replace(/\n$/, '')
                   return !inline && match ? (
                     <div className="relative">
                       <CodeBlock language={match[1]} value={codeString} />
                     </div>
                   ) : (
                     <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md text-[13px] font-mono before:content-none after:content-none border border-border/40" {...props}>
                       {children}
                     </code>
                   )
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
          
          {/* Actions */}
          <div className="flex items-center gap-1 mt-4 -ml-2 opacity-50 hover:opacity-100 transition-opacity">
            <CopyButton value={message.content} />
            {!isUser && isLast && onRegenerate && (
              <Button variant="ghost" size="icon" onClick={onRegenerate} className="h-8 w-8 text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <RefreshCcw className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CodeBlock({ language, value }: { language: string, value: string }) {
  const [copied, setCopied] = useState(false)
  
  const onCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-zinc-200/50 dark:border-zinc-800/80 bg-zinc-950 font-mono">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <span className="text-xs text-zinc-400 font-medium tracking-wider lowercase">{language}</span>
        <button onClick={onCopy} className="text-zinc-400 hover:text-white transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm">
          {copied ? <CheckIcon className="w-3.5 h-3.5 text-green-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div className="p-4 overflow-auto text-[13px] max-h-[500px]">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus as any}
          customStyle={{ margin: 0, padding: 0, background: 'transparent' }}
          wrapLines={true}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  
  const onCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <Button variant="ghost" size="icon" onClick={onCopy} className="h-8 w-8 text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg outline-none focus-visible:ring-1 focus-visible:ring-ring">
      {copied ? <CheckIcon className="w-3.5 h-3.5 text-green-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
    </Button>
  )
}
