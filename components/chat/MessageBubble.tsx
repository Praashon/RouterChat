"use client";

import { ChatMessage } from "@/lib/store";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  CopyIcon,
  CheckIcon,
  UserIcon,
  BotIcon,
  RefreshCcw,
} from "lucide-react";
import { useState, type ReactNode, memo } from "react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

export const MessageBubble = memo(function MessageBubble({
  message,
  onRegenerate,
  isLast,
  isGenerating,
}: {
  message: ChatMessage;
  onRegenerate?: () => void;
  isLast?: boolean;
  isGenerating?: boolean;
}) {
  const isUser = message.role === "user";
  const userName = useAppStore((state) => state.userName);
  const assistantName = useAppStore((state) => state.assistantName);

  const isStreaming = !isUser && isLast && isGenerating;

  return (
    <div
      className={`w-full py-4 sm:py-6 flex px-3 sm:px-4 md:px-6 ${isUser ? "bg-background" : "bg-zinc-50/50 dark:bg-zinc-900/20 border-y border-border/40"}`}
    >
      <div className="max-w-3xl mx-auto w-full flex gap-3 sm:gap-5">
        <div className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 mt-0.5 rounded-[10px] border border-border/60 flex items-center justify-center bg-background shadow-sm">
          {isUser ? (
            <UserIcon className="w-4 h-4 opacity-70" />
          ) : (
            <BotIcon className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
          )}
        </div>

        <div
          className={`flex-1 min-w-0 ${isStreaming ? "animate-streaming-message" : ""}`}
        >
          <div className="font-semibold text-[13px] text-foreground mb-2 tracking-tight font-heading">
            {isUser ? userName || "User" : assistantName || "Assistant"}
          </div>

          {message.content === "" && isStreaming ? (
            <div className="flex gap-1.5 items-center h-[24px] mt-1 text-zinc-400">
              <span
                className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          ) : (
            <div className="chat-markdown">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Headings
                  h1: ({ children }) => (
                    <h1 className="text-[22px] font-bold tracking-tight text-foreground mt-6 mb-3 pb-2 border-b border-border/40 font-heading first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-[18px] font-bold tracking-tight text-foreground mt-5 mb-2.5 font-heading first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-[16px] font-semibold tracking-tight text-foreground mt-4 mb-2 font-heading first:mt-0">
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-[15px] font-semibold text-foreground mt-3 mb-1.5 font-heading first:mt-0">
                      {children}
                    </h4>
                  ),

                  // Paragraphs
                  p: ({ children }) => (
                    <p className="text-[15px] leading-[1.75] text-foreground/90 my-2.5 first:mt-0 last:mb-0">
                      {children}
                    </p>
                  ),

                  // Strong / Bold
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">
                      {children}
                    </strong>
                  ),

                  // Emphasis / Italic
                  em: ({ children }) => (
                    <em className="italic text-foreground/80">{children}</em>
                  ),

                  // Unordered lists
                  ul: ({ children }) => (
                    <ul className="my-3 ml-1 space-y-1.5 list-none first:mt-0">
                      {children}
                    </ul>
                  ),

                  // Ordered lists
                  ol: ({ children, start }) => (
                    <ol
                      start={start}
                      className="my-3 ml-1 space-y-1.5 list-none counter-reset-list first:mt-0"
                    >
                      {children}
                    </ol>
                  ),

                  // List items
                  li: ({ children, ordered, index }: any) => (
                    <li className="relative pl-6 text-[15px] leading-[1.7] text-foreground/90">
                      <span
                        className="absolute left-0 top-0 select-none text-zinc-400 dark:text-zinc-500 text-[14px] font-medium"
                        aria-hidden="true"
                      >
                        {ordered !== undefined && typeof index === "number"
                          ? `${index + 1}.`
                          : "\u2022"}
                      </span>
                      {children}
                    </li>
                  ),

                  // Blockquotes
                  blockquote: ({ children }) => (
                    <blockquote className="my-4 pl-4 border-l-[3px] border-zinc-300 dark:border-zinc-600 text-foreground/75 italic first:mt-0">
                      {children}
                    </blockquote>
                  ),

                  // Horizontal rules
                  hr: () => (
                    <hr className="my-6 border-none h-px bg-zinc-200 dark:bg-zinc-800" />
                  ),

                  // Links
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-900 dark:text-zinc-100 underline underline-offset-[3px] decoration-zinc-400/50 dark:decoration-zinc-500/50 hover:decoration-zinc-600 dark:hover:decoration-zinc-300 transition-colors font-medium"
                    >
                      {children}
                    </a>
                  ),

                  // Tables
                  table: ({ children }) => (
                    <div className="my-4 overflow-x-auto rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 first:mt-0">
                      <table className="w-full text-[14px] border-collapse">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-zinc-100/80 dark:bg-zinc-800/50">
                      {children}
                    </thead>
                  ),
                  th: ({ children }) => (
                    <th className="px-4 py-2.5 text-left font-semibold text-[13px] text-foreground tracking-tight border-b border-zinc-200/60 dark:border-zinc-700/60">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-2.5 text-[14px] text-foreground/85 border-b border-zinc-100 dark:border-zinc-800/40">
                      {children}
                    </td>
                  ),
                  tr: ({ children }) => (
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                      {children}
                    </tr>
                  ),

                  // Code blocks
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    const codeString = String(children).replace(/\n$/, "");
                    return !inline && match ? (
                      <div className="relative">
                        <CodeBlock language={match[1]} value={codeString} />
                      </div>
                    ) : (
                      <code
                        className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md text-[13px] font-mono before:content-none after:content-none border border-border/40 text-zinc-800 dark:text-zinc-200"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 mt-4 -ml-2 opacity-50 hover:opacity-100 transition-opacity">
            <CopyButton value={message.content} />
            {!isUser && isLast && onRegenerate && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRegenerate}
                className="h-8 w-8 text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-zinc-200/50 dark:border-zinc-800/80 bg-zinc-950 font-mono">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <span className="text-xs text-zinc-400 font-medium tracking-wider lowercase">
          {language}
        </span>
        <button
          onClick={onCopy}
          className="text-zinc-400 hover:text-white transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
        >
          {copied ? (
            <CheckIcon className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <CopyIcon className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
      <div className="p-4 overflow-auto text-[13px] max-h-[500px]">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus as any}
          customStyle={{ margin: 0, padding: 0, background: "transparent" }}
          wrapLines={true}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onCopy}
      className="h-8 w-8 text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {copied ? (
        <CheckIcon className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <CopyIcon className="w-3.5 h-3.5" />
      )}
    </Button>
  );
}
