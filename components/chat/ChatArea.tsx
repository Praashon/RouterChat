"use client";

import { useAppStore } from "@/lib/store";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { useEffect, useRef, useState } from "react";
import { createOpenAIClient, fetchOpenRouterModels } from "@/lib/openrouter";
import { BotIcon, MessageSquareIcon } from "lucide-react";

export function ChatArea() {
  const {
    apiKey,
    chats,
    activeChatId,
    addMessage,
    updateMessage,
    cachedFreeModelIds,
    cachedModelNames,
    setCachedFreeModelIds,
    setCachedModelNames,
  } = useAppStore();
  const activeChat = chats.find((c) => c.id === activeChatId);
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrolledToBottom = useRef(true);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // If user is within 100px of the bottom, keep auto-scrolling
    isScrolledToBottom.current = scrollHeight - scrollTop - clientHeight < 100;
  };

  useEffect(() => {
    if (scrollRef.current && isScrolledToBottom.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChat?.messages]);

  // Client-side sanitizer: strips emdashes and emojis regardless of what the model outputs
  const sanitizeOutput = (text: string): string => {
    // Replace em dash, en dash, and horizontal bar with " - "
    let cleaned = text.replace(/[\u2014\u2013\u2015]/g, " - ");
    // Remove all emoji characters (comprehensive Unicode emoji ranges)
    cleaned = cleaned.replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{231A}\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2614}\u{2615}\u{2648}-\u{2653}\u{267F}\u{2693}\u{26A1}\u{26AA}\u{26AB}\u{26BD}\u{26BE}\u{26C4}\u{26C5}\u{26CE}\u{26D4}\u{26EA}\u{26F2}\u{26F3}\u{26F5}\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}\u{2712}\u{2714}\u{2716}\u{271D}\u{2721}\u{2728}\u{2733}\u{2734}\u{2744}\u{2747}\u{274C}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}\u{2764}\u{2795}-\u{2797}\u{27A1}\u{27B0}\u{27BF}\u{2934}\u{2935}\u{2B05}-\u{2B07}\u{2B1B}\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}\u{00A9}\u{00AE}\u{203C}\u{2049}]/gu,
      "",
    );
    // Clean up double spaces from removed emojis
    cleaned = cleaned.replace(/  +/g, " ");
    return cleaned;
  };

  const handleSend = async (content: string) => {
    if (!activeChat || !apiKey) return;

    // Force scroll to bottom when user explicitly sends a new message
    isScrolledToBottom.current = true;
    addMessage(activeChat.id, { role: "user", content });

    const baseSystem = activeChat.systemPrompt
      ? activeChat.systemPrompt + "\n\n"
      : "";
    const permanentRules = `ABSOLUTE OUTPUT RULES (HIGHEST PRIORITY, NON-NEGOTIABLE):
- NEVER use em dashes or en dashes. The characters \u2014 and \u2013 are BANNED. Use commas, semicolons, colons, periods, or parentheses instead.
- NEVER use any emoji or emoticon characters. Not a single one. No exceptions.
- Use plain hyphens (-) only for compound words such as "well-known" or "open-source".
- If you would normally write an em dash, rewrite the sentence using a comma or semicolon.
Violating these rules makes the response completely unusable. Follow them in EVERY response.`;

    const systemPayload = [
      { role: "system" as const, content: baseSystem + permanentRules },
    ];

    const historyPayload = activeChat.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const newPayload = { role: "user" as const, content };
    const messages = [...systemPayload, ...historyPayload, newPayload];

    setIsGenerating(true);

    // Fallback for crypto in older browsers, but crypto.randomUUID is standard in modern browsers
    const tempId = crypto.randomUUID();
    addMessage(activeChat.id, { id: tempId, role: "assistant", content: "" });

    let accumulated = "";

    // Helper: classify OpenRouter errors into actionable categories
    const classifyError = (
      err: any,
    ): {
      type:
        | "rate_limit"
        | "no_endpoints"
        | "auth"
        | "abort"
        | "unknown"
        | "payment";
      message: string;
    } => {
      if (err.name === "AbortError") return { type: "abort", message: "" };
      // OpenAI SDK may nest the real message in err.error?.message
      const rawMsg =
        err.message || err.error?.message || err.error?.error?.message || "";
      const msg = rawMsg.toLowerCase();
      const status = err.status || err.statusCode || err.code || 0;

      // Log for debugging (visible in browser console, using warn to avoid Next.js error overlay)
      console.warn("[RouterChat] API error:", {
        status,
        message: rawMsg,
        type: err.constructor?.name,
        raw: err,
      });

      if (
        status === 429 ||
        msg.includes("429") ||
        msg.includes("rate limit") ||
        msg.includes("too many") ||
        msg.includes("overloaded")
      ) {
        return { type: "rate_limit", message: rawMsg };
      }
      if (
        status === 502 ||
        status === 503 ||
        msg.includes("guardrail") ||
        msg.includes("no endpoints") ||
        msg.includes("no available") ||
        msg.includes("free endpoints") ||
        msg.includes("not available") ||
        msg.includes("no providers") ||
        msg.includes("provider") ||
        msg.includes("upstream")
      ) {
        return { type: "no_endpoints", message: rawMsg };
      }
      if (
        status === 402 ||
        msg.includes("402") ||
        msg.includes("insufficient") ||
        msg.includes("balance") ||
        msg.includes("credits")
      ) {
        return { type: "payment", message: rawMsg };
      }
      if (
        status === 401 ||
        msg.includes("401") ||
        msg.includes("api key") ||
        msg.includes("unauthorized")
      ) {
        return { type: "auth", message: rawMsg };
      }
      return {
        type: "unknown",
        message: rawMsg || "An unexpected error occurred.",
      };
    };

    // Build fallback list from cached free models, or fetch fresh if cache is empty
    const getFallbackModels = async (): Promise<string[]> => {
      let freeIds = cachedFreeModelIds;
      if (freeIds.length === 0 && apiKey) {
        try {
          const models = await fetchOpenRouterModels(apiKey);
          freeIds = models
            .filter(
              (m) => m.id.endsWith(":free") || m.pricing?.prompt === "0",
            )
            .map((m) => m.id);
          setCachedFreeModelIds(freeIds);
          const nameMap: Record<string, string> = {};
          models.forEach((m) => {
            nameMap[m.id] = m.name;
          });
          setCachedModelNames(nameMap);
        } catch {
          // If fetch fails, no fallbacks available
          return [];
        }
      }
      return freeIds.filter((m) => m !== activeChat.model).slice(0, 8);
    };

    try {
      const openai = createOpenAIClient(apiKey);
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Attempt primary model first
      const attemptStream = async (modelId: string) => {
        const stream = await openai.chat.completions.create(
          {
            model: modelId,
            messages: messages as any,
            stream: true,
            temperature: activeChat.settings.temperature,
            top_p: activeChat.settings.top_p,
            frequency_penalty: activeChat.settings.frequency_penalty,
            presence_penalty: activeChat.settings.presence_penalty,
          },
          { signal: controller.signal },
        );

        let lastUpdateTime = Date.now();
        accumulated = "";

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) {
            accumulated += text;
            const now = Date.now();
            if (now - lastUpdateTime > 35) {
              updateMessage(
                activeChat.id,
                tempId,
                sanitizeOutput(accumulated) + " \u258d",
              );
              lastUpdateTime = now;
            }
          }
        }

        updateMessage(activeChat.id, tempId, sanitizeOutput(accumulated));
      };

      try {
        await attemptStream(activeChat.model);
      } catch (primaryErr: any) {
        const classified = classifyError(primaryErr);

        // Abort: bubble immediately
        if (classified.type === "abort") throw primaryErr;

        // Auth: stop immediately, no retry
        if (classified.type === "auth") {
          updateMessage(
            activeChat.id,
            tempId,
            `**Authentication Error**\n\nYour API key is invalid or expired. Please update it by clicking the "API Key" button in the top right corner.`,
          );
          return;
        }

        // Payment required - no fallback possible
        if (classified.type === "payment") {
          updateMessage(
            activeChat.id,
            tempId,
            `**Insufficient Credits**\n\nThis is a paid model and your OpenRouter account has insufficient balance. Please add credits at [openrouter.ai/credits](https://openrouter.ai/credits) to use this model.`,
          );
          return;
        }

        // Any retriable error (rate_limit, no_endpoints, unknown): try fallback models
        {
          const reason =
            classified.type === "rate_limit"
              ? "Rate limited"
              : classified.type === "no_endpoints"
                ? "Model unavailable"
                : "Model error";
          let fallbackSuccess = false;
          let allNoEndpoints = classified.type === "no_endpoints";
          const fallbackModels = await getFallbackModels();
          for (let i = 0; i < fallbackModels.length; i++) {
            const fallbackModel = fallbackModels[i];
            const displayName =
              cachedModelNames[fallbackModel] ||
              fallbackModel.split("/")[1]?.replace(/:free$/, "") ||
              fallbackModel;
            try {
              updateMessage(
                activeChat.id,
                tempId,
                `*${reason}. Retrying with ${displayName}...*`,
              );
              // Brief delay between fallback attempts to let rate limits clear
              if (i > 0) {
                await new Promise((r) => setTimeout(r, 1500));
              }
              await attemptStream(fallbackModel);
              fallbackSuccess = true;
              break;
            } catch (fallbackErr: any) {
              const fbClassified = classifyError(fallbackErr);
              if (fbClassified.type === "abort") throw fallbackErr;
              // Track whether every single failure is no_endpoints (account-level issue)
              if (fbClassified.type !== "no_endpoints")
                allNoEndpoints = false;
              // Continue trying next fallback on any retriable error
            }
          }
          if (!fallbackSuccess) {
            if (allNoEndpoints) {
              // Every model hit no_endpoints - likely an account settings issue
              updateMessage(
                activeChat.id,
                tempId,
                `**No Free Endpoints Available**\n\nOpenRouter cannot route to any free provider.\n\n**How to fix this:**\n1. Go to [openrouter.ai/settings/privacy](https://openrouter.ai/settings/privacy)\n2. Ensure all 3 **"Enable free endpoints..."** toggles are switched **ON**.\n3. Come back and try again.\n\nIf toggles are already on, these models may be temporarily offline.`,
              );
            } else {
              updateMessage(
                activeChat.id,
                tempId,
                `**All Models Unavailable**\n\nFree models are currently overloaded or offline. Please wait 30-60 seconds and try again, or switch to a paid model for reliable access.`,
              );
            }
          }
          return;
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        updateMessage(activeChat.id, tempId, accumulated);
      } else {
        updateMessage(
          activeChat.id,
          tempId,
          `**Unexpected Error**\n\n${err.message || "An unknown error occurred."}\n\nPlease try again.`,
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  };

  if (!activeChatId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background">
        <div className="w-16 h-16 rounded-[1.25rem] bg-zinc-50 dark:bg-zinc-900 border border-border/40 flex items-center justify-center mb-6 shadow-[0_0_1px_1px_rgba(0,0,0,0.03)] dark:shadow-[0_0_1px_1px_rgba(255,255,255,0.03)]">
          <MessageSquareIcon className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
        </div>
        <h2 className="text-2xl font-medium tracking-tight text-foreground mb-2">
          Welcome to RouterChat
        </h2>
        <p className="text-muted-foreground text-[15px] max-w-sm leading-relaxed mb-8">
          Your premium AI chat interface powered by OpenRouter.
        </p>

        <WelcomeGuide />
      </div>
    );
  }

  if (!activeChat) return null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {activeChat.messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-border/40 shadow-sm flex items-center justify-center mb-6">
            <BotIcon className="w-8 h-8 text-zinc-500 dark:text-zinc-400" />
          </div>
          <h2 className="text-2xl font-medium tracking-tight text-foreground mb-3">
            How can I help you today?
          </h2>
          <p className="text-muted-foreground text-[15px] max-w-[280px] leading-relaxed mb-8 flex flex-col gap-1 items-center">
            <span className="opacity-70">Using model</span>
            <span className="font-medium text-foreground px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[13px] font-mono shadow-sm border border-border/50">
              {cachedModelNames[activeChat.model] ||
                activeChat.model.split("/")[1] ||
                activeChat.model}
            </span>
          </p>
          {!apiKey && (
            <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <WelcomeGuide />
            </div>
          )}
        </div>
      ) : (
        <div
          className="flex-1 overflow-y-auto"
          ref={scrollRef}
          onScroll={handleScroll}
        >
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

      <ChatInput
        onSend={handleSend}
        isGenerating={isGenerating}
        onStop={handleStop}
      />
    </div>
  );
}

function WelcomeGuide() {
  return (
    <div className="w-full max-w-md space-y-3 text-left">
      <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-border/40">
        <div className="w-7 h-7 rounded-lg bg-zinc-200/80 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 text-[13px] font-semibold text-foreground">
          1
        </div>
        <div>
          <p className="text-[14px] font-medium text-foreground">
            Get your free API key
          </p>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Visit{" "}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              openrouter.ai/keys
            </a>{" "}
            and create one.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-border/40">
        <div className="w-7 h-7 rounded-lg bg-zinc-200/80 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 text-[13px] font-semibold text-foreground">
          2
        </div>
        <div>
          <p className="text-[14px] font-medium text-foreground">
            Enable all free endpoints
          </p>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Go to{" "}
            <a
              href="https://openrouter.ai/settings/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              openrouter.ai/settings/privacy
            </a>{" "}
            and turn ON the 3 free endpoint toggles.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-border/40">
        <div className="w-7 h-7 rounded-lg bg-zinc-200/80 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 text-[13px] font-semibold text-foreground">
          3
        </div>
        <div>
          <p className="text-[14px] font-medium text-foreground">
            Paste your key here
          </p>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Click the "API Key" button in the top right corner and paste it in.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-border/40">
        <div className="w-7 h-7 rounded-lg bg-zinc-200/80 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 text-[13px] font-semibold text-foreground">
          4
        </div>
        <div>
          <p className="text-[14px] font-medium text-foreground">
            Start chatting
          </p>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Type a message below to start your first conversation.
          </p>
        </div>
      </div>
    </div>
  );
}
