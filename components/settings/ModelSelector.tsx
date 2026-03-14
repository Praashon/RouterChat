"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { OpenRouterModel, fetchOpenRouterModels } from "@/lib/openrouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Using native overflow + scrollbar-thin CSS instead of ScrollArea for reliable scrollbar visibility
import {
  SearchIcon,
  Sparkles,
  ChevronDown,
  Check,
  Coins,
  ExternalLink,
  Zap,
  RefreshCw,
  Hash,
  Clock,
  ArrowUpDown,
  Loader2,
} from "lucide-react";

const TOP_PROVIDERS = [
  "anthropic",
  "openai",
  "google",
  "meta-llama",
  "mistralai",
  "deepseek",
  "qwen",
  "cohere",
  "nvidia",
  "microsoft",
  "x-ai",
  "perplexity",
  "amazon",
  "ai21",
];

function isFreeModel(m: OpenRouterModel): boolean {
  return m.id.endsWith(":free") || m.pricing?.prompt === "0";
}

function getProvider(id: string): string {
  return id.split("/")[0] || id;
}

function formatNumber(num: number): string {
  if (!num) return "?";
  if (num >= 1_000_000)
    return (num / 1_000_000).toFixed(num >= 10_000_000 ? 0 : 1) + "M";
  if (num >= 1_000) return Math.floor(num / 1_000) + "K";
  return num.toString();
}

function formatPrice(pricePerToken: string | undefined): string | null {
  if (pricePerToken === undefined || pricePerToken === null) return null;
  const n = Number(pricePerToken);
  if (isNaN(n) || n === 0) return "Free";
  const perMillion = n * 1_000_000;
  if (perMillion < 0.01) return "<$0.01";
  if (perMillion >= 100) return "$" + perMillion.toFixed(0);
  if (perMillion >= 1) return "$" + perMillion.toFixed(2);
  return "$" + perMillion.toFixed(3);
}

function daysSinceCreated(created?: number): number | null {
  if (!created) return null;
  return Math.floor((Date.now() / 1000 - created) / 86400);
}

function computeRecommendationScore(m: OpenRouterModel): number {
  let score = 0;
  const provider = getProvider(m.id);
  if (TOP_PROVIDERS.includes(provider)) score += 30;

  const days = daysSinceCreated(m.created);
  if (days !== null) {
    if (days <= 30) score += 25;
    else if (days <= 90) score += 15;
    else if (days <= 180) score += 5;
  }

  if (m.context_length >= 200_000) score += 15;
  else if (m.context_length >= 100_000) score += 10;
  else if (m.context_length >= 32_000) score += 5;

  const maxComp = m.top_provider?.max_completion_tokens;
  if (maxComp && maxComp >= 16_000) score += 10;
  else if (maxComp && maxComp >= 4_000) score += 5;

  const modality = m.architecture?.modality?.toLowerCase() || "";
  if (modality.includes("text")) score += 5;

  return score;
}

export function ModelSelector() {
  const {
    apiKey,
    chats,
    activeChatId,
    updateChatModel,
    setCachedFreeModelIds,
    cachedModelNames,
    setCachedModelNames,
  } = useAppStore();
  const activeChat = chats.find((c) => c.id === activeChatId);

  const [isOpen, setIsOpen] = useState(false);
  const [allModels, setAllModels] = useState<OpenRouterModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [primaryFilter, setPrimaryFilter] = useState<"all" | "free" | "paid">(
    "all",
  );
  const [sortBy, setSortBy] = useState<
    "recommended" | "newest" | "name" | "context" | "price-low" | "price-high"
  >("recommended");
  const [providerFilter, setProviderFilter] = useState<string | null>(null);

  const [protectedModel, setProtectedModel] = useState<OpenRouterModel | null>(
    null,
  );

  const fetchModels = useCallback(async () => {
    if (!apiKey) return;
    setLoading(true);
    setFetchError(null);
    try {
      const data = await fetchOpenRouterModels(apiKey);
      setAllModels(data);
      const freeIds = data.filter((m) => isFreeModel(m)).map((m) => m.id);
      setCachedFreeModelIds(freeIds);
      const nameMap: Record<string, string> = {};
      data.forEach((m) => {
        nameMap[m.id] = m.name;
      });
      setCachedModelNames(nameMap);
    } catch (err: any) {
      setFetchError(err.message || "Failed to fetch models");
    } finally {
      setLoading(false);
    }
  }, [apiKey, setCachedFreeModelIds, setCachedModelNames]);

  useEffect(() => {
    if (isOpen && apiKey) {
      fetchModels();
      setSearch("");
      setProtectedModel(null);
    }
  }, [isOpen, apiKey, fetchModels]);

  const availableProviders = useMemo(() => {
    const providerMap = new Map<string, number>();
    allModels.forEach((m) => {
      const p = getProvider(m.id);
      providerMap.set(p, (providerMap.get(p) || 0) + 1);
    });
    return Array.from(providerMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [allModels]);

  const displayModels = useMemo(() => {
    const s = search.toLowerCase().trim();

    let result = allModels.filter((m) => {
      if (
        s &&
        !m.name.toLowerCase().includes(s) &&
        !m.id.toLowerCase().includes(s) &&
        !(m.description || "").toLowerCase().includes(s)
      ) {
        return false;
      }
      if (primaryFilter === "free" && !isFreeModel(m)) return false;
      if (primaryFilter === "paid" && isFreeModel(m)) return false;
      if (providerFilter && getProvider(m.id) !== providerFilter) return false;
      return true;
    });

    switch (sortBy) {
      case "recommended":
        result.sort(
          (a, b) =>
            computeRecommendationScore(b) - computeRecommendationScore(a),
        );
        break;
      case "newest":
        result.sort((a, b) => (b.created || 0) - (a.created || 0));
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "context":
        result.sort(
          (a, b) => (b.context_length || 0) - (a.context_length || 0),
        );
        break;
      case "price-low":
        result.sort(
          (a, b) =>
            Number(a.pricing?.prompt || 0) - Number(b.pricing?.prompt || 0),
        );
        break;
      case "price-high":
        result.sort(
          (a, b) =>
            Number(b.pricing?.prompt || 0) - Number(a.pricing?.prompt || 0),
        );
        break;
    }

    return result;
  }, [allModels, search, primaryFilter, sortBy, providerFilter]);

  const groupedDisplay = useMemo(() => {
    if (primaryFilter !== "all") {
      return { singleList: displayModels, free: [], paid: [] };
    }
    const free = displayModels.filter((m) => isFreeModel(m));
    const paid = displayModels.filter((m) => !isFreeModel(m));
    return { singleList: null, free, paid };
  }, [displayModels, primaryFilter]);

  const totalCount = allModels.length;
  const freeCount = allModels.filter(isFreeModel).length;
  const paidCount = totalCount - freeCount;

  const handleSelect = (model: OpenRouterModel) => {
    if (!isFreeModel(model)) {
      setProtectedModel(model);
      return;
    }
    if (activeChatId) updateChatModel(activeChatId, model.id);
    setIsOpen(false);
  };

  const handleForcePaidSelect = (model: OpenRouterModel) => {
    if (activeChatId) updateChatModel(activeChatId, model.id);
    setProtectedModel(null);
    setIsOpen(false);
  };

  // Use global cache for instant name display, local state as secondary
  const currentModelId = activeChat?.model;
  const currentModelName =
    cachedModelNames[currentModelId || ""] ||
    allModels.find((m) => m.id === currentModelId)?.name ||
    currentModelId?.split("/").pop()?.replace(":free", "") ||
    "Select Model";

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) setProtectedModel(null);
          setIsOpen(open);
        }}
      >
        <DialogTrigger
          render={
            <Button
              variant="ghost"
              className="h-9 gap-1.5 sm:gap-2 rounded-xl text-foreground font-medium tracking-tight hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 pr-2 overflow-hidden shadow-none max-w-[140px] sm:max-w-[200px] md:max-w-xs justify-start text-[13px] sm:text-[14px]"
            />
          }
        >
          <span className="truncate">{currentModelName}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
        </DialogTrigger>

        <DialogContent className="max-w-[95vw] sm:max-w-2xl rounded-2xl border-zinc-200/40 dark:border-zinc-800/40 shadow-2xl bg-background/95 backdrop-blur-xl gap-0 p-0 overflow-hidden h-[85vh] sm:h-[80vh] flex flex-col">
          {protectedModel ? (
            <div className="flex flex-col h-full items-center justify-center p-8 text-center bg-zinc-50/50 dark:bg-zinc-900/20">
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-border/40 shadow-sm flex items-center justify-center mb-6">
                <Coins className="w-8 h-8 text-zinc-700 dark:text-zinc-300" />
              </div>
              <h2 className="text-2xl font-medium tracking-tight mb-3 text-foreground">
                Premium Model Selected
              </h2>
              <DialogDescription className="text-muted-foreground text-[15px] leading-relaxed max-w-sm mb-2">
                <span className="font-medium text-foreground">
                  {protectedModel.name}
                </span>{" "}
                requires OpenRouter credits.
              </DialogDescription>
              {protectedModel.pricing && (
                <p className="text-xs text-muted-foreground mb-8">
                  Prompt: {formatPrice(protectedModel.pricing.prompt)}/1M tokens
                  {" "}&middot;{" "}
                  Completion: {formatPrice(protectedModel.pricing.completion)}/1M tokens
                </p>
              )}

              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button
                  onClick={() =>
                    window.open("https://openrouter.ai/credits", "_blank")
                  }
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
              {/* Header / Search / Filters */}
              <div className="p-3 sm:p-4 border-b border-border/40 bg-zinc-50/50 dark:bg-zinc-900/20 flex flex-col gap-2.5">
                {/* Search + Refresh */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search all models..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-10 pl-9 pr-3 rounded-xl bg-background border-zinc-200/60 dark:border-zinc-800/60 focus-visible:ring-1 focus-visible:ring-zinc-400/50 shadow-sm text-[14px]"
                    />
                  </div>
                  <button
                    onClick={fetchModels}
                    disabled={loading}
                    className="h-10 w-10 flex items-center justify-center rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-background hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-muted-foreground hover:text-foreground transition-colors shrink-0 disabled:opacity-50"
                    title="Refresh models"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                    />
                  </button>
                </div>

                {/* Live count */}
                {!loading && totalCount > 0 && (
                  <div className="flex items-center gap-2 px-1 text-[11px] text-muted-foreground font-medium tracking-wide">
                    <span>{totalCount} models</span>
                    <span className="opacity-30">|</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {freeCount} free
                    </span>
                    <span className="opacity-30">|</span>
                    <span>{paidCount} paid</span>
                    {search && (
                      <>
                        <span className="opacity-30">|</span>
                        <span>
                          {displayModels.length} match
                          {displayModels.length !== 1 ? "es" : ""}
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* Primary filter: All / Free / Paid */}
                <div className="flex items-center gap-1.5">
                  {(["all", "free", "paid"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setPrimaryFilter(f)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide capitalize shrink-0 transition-colors ${
                        primaryFilter === f
                          ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                          : "bg-zinc-200/50 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-400 dark:hover:bg-zinc-800 border border-transparent hover:border-border/50"
                      }`}
                    >
                      {f === "all"
                        ? `All (${totalCount})`
                        : f === "free"
                          ? `Free (${freeCount})`
                          : `Paid (${paidCount})`}
                    </button>
                  ))}
                </div>

                {/* Sort options */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                  <ArrowUpDown className="w-3 h-3 text-muted-foreground shrink-0 mr-0.5" />
                  {(
                    [
                      "recommended",
                      "newest",
                      "name",
                      "context",
                      "price-low",
                      "price-high",
                    ] as const
                  ).map((s) => {
                    const labels: Record<string, string> = {
                      recommended: "Recommended",
                      newest: "Newest",
                      name: "A-Z",
                      context: "Context",
                      "price-low": "Cheapest",
                      "price-high": "Priciest",
                    };
                    return (
                      <button
                        key={s}
                        onClick={() => setSortBy(s)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium tracking-wide shrink-0 transition-colors ${
                          sortBy === s
                            ? "bg-zinc-200/80 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                            : "text-zinc-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-foreground"
                        }`}
                      >
                        {labels[s]}
                      </button>
                    );
                  })}
                </div>

                {/* Provider quick-filter chips */}
                {availableProviders.length > 0 && (
                  <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                    <button
                      onClick={() => setProviderFilter(null)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium tracking-wide shrink-0 transition-colors ${
                        providerFilter === null
                          ? "bg-zinc-200/80 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                          : "text-zinc-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-foreground"
                      }`}
                    >
                      All providers
                    </button>
                    {availableProviders.slice(0, 20).map(({ name, count }) => (
                      <button
                        key={name}
                        onClick={() =>
                          setProviderFilter(
                            providerFilter === name ? null : name,
                          )
                        }
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium tracking-wide shrink-0 transition-colors whitespace-nowrap ${
                          providerFilter === name
                            ? "bg-zinc-200/80 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                            : "text-zinc-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-foreground"
                        }`}
                      >
                        {name}{" "}
                        <span className="opacity-50 ml-0.5">({count})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Model List */}
              <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                {!apiKey ? (
                  <div className="h-40 flex items-center justify-center text-muted-foreground text-sm font-medium">
                    Configure your API key first to view models.
                  </div>
                ) : loading ? (
                  <div className="h-40 flex flex-col items-center justify-center text-muted-foreground text-sm font-medium gap-3">
                    <Loader2 className="w-5 h-5 animate-spin opacity-50" />
                    <span>Fetching all OpenRouter models...</span>
                  </div>
                ) : fetchError ? (
                  <div className="h-40 flex flex-col items-center justify-center text-muted-foreground text-sm font-medium gap-3">
                    <span>Failed to load models: {fetchError}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchModels}
                      className="rounded-xl"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
                    </Button>
                  </div>
                ) : displayModels.length === 0 ? (
                  <div className="h-40 flex items-center justify-center text-muted-foreground text-sm font-medium">
                    No models found matching your filters.
                  </div>
                ) : (
                  <div className="p-1 sm:p-2 space-y-4">
                    {groupedDisplay.singleList !== null ? (
                      <div className="space-y-1">
                        {groupedDisplay.singleList.map((model) => (
                          <ModelRow
                            key={model.id}
                            model={model}
                            isActive={activeChat?.model === model.id}
                            onSelect={() => handleSelect(model)}
                            isFree={isFreeModel(model)}
                          />
                        ))}
                      </div>
                    ) : (
                      <>
                        {groupedDisplay.free.length > 0 && (
                          <div className="space-y-1.5">
                            <h4 className="px-3 text-[11px] font-semibold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1.5 pt-1">
                              <Sparkles className="w-3.5 h-3.5" /> Free Models
                              <span className="text-muted-foreground font-normal ml-1">
                                ({groupedDisplay.free.length})
                              </span>
                            </h4>
                            <div className="space-y-0.5">
                              {groupedDisplay.free.map((model) => (
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

                        {groupedDisplay.paid.length > 0 && (
                          <div className="space-y-1.5">
                            <h4 className="px-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5 pt-3 border-t border-border/40">
                              <Coins className="w-3.5 h-3.5" /> Paid Models
                              <span className="font-normal ml-1">
                                ({groupedDisplay.paid.length})
                              </span>
                            </h4>
                            <div className="space-y-0.5">
                              {groupedDisplay.paid.map((model) => (
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
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ModelRow({
  model,
  isActive,
  onSelect,
  isFree = false,
}: {
  model: OpenRouterModel;
  isActive: boolean;
  onSelect: () => void;
  isFree?: boolean;
}) {
  const provider = getProvider(model.id);
  const promptPrice = formatPrice(model.pricing?.prompt);
  const maxTokens = model.top_provider?.max_completion_tokens;
  const modality = model.architecture?.modality;
  const days = daysSinceCreated(model.created);
  const isNew = days !== null && days <= 14;

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl text-left transition-all outline-none focus-visible:ring-1 focus-visible:ring-ring group ${
        isActive
          ? "bg-zinc-100 dark:bg-zinc-800"
          : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50 active:bg-zinc-100 dark:active:bg-zinc-800/80"
      }`}
    >
      <div className="flex flex-col gap-1 min-w-0 pr-3 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium text-[13px] sm:text-[14px] tracking-tight truncate text-foreground">
            {model.name}
          </span>
          {isFree && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold tracking-wide shrink-0 uppercase">
              Free
            </span>
          )}
          {isNew && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-semibold tracking-wide shrink-0 uppercase">
              New
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-muted-foreground flex-wrap">
          <span className="truncate max-w-28 opacity-70">{provider}</span>
          <span className="flex items-center gap-0.5">
            <Zap className="w-2.5 h-2.5" /> {formatNumber(model.context_length)}{" "}
            ctx
          </span>
          {maxTokens && (
            <span className="flex items-center gap-0.5 opacity-70">
              <Hash className="w-2.5 h-2.5" /> {formatNumber(maxTokens)} out
            </span>
          )}
          {modality && (
            <span className="opacity-60 hidden sm:block">{modality}</span>
          )}
          {days !== null && (
            <span className="items-center gap-0.5 opacity-50 hidden sm:flex">
              <Clock className="w-2.5 h-2.5" /> {days}d ago
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!isFree && promptPrice && (
          <div className="text-right flex flex-col items-end gap-0 opacity-60 group-hover:opacity-80 transition-opacity">
            <span className="text-[10px] uppercase font-medium tracking-wider leading-tight">
              prompt/1M
            </span>
            <span className="text-[12px] font-medium font-mono leading-tight">
              {promptPrice}
            </span>
          </div>
        )}
        {isActive && (
          <div className="w-6 h-6 flex items-center justify-center text-foreground">
            <Check className="w-4 h-4" />
          </div>
        )}
      </div>
    </button>
  );
}
