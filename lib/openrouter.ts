import OpenAI from "openai";

export interface OpenRouterModel {
  id: string;
  name: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
  top_provider: {
    max_completion_tokens: number | null;
  };
  created?: number;
}

export async function fetchOpenRouterModels(apiKey: string): Promise<OpenRouterModel[]> {
  const response = await fetch("https://openrouter.ai/api/v1/models", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
      "X-OpenRouter-Title": "RouterChat",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

export function createOpenAIClient(apiKey: string) {
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    dangerouslyAllowBrowser: true,
    defaultHeaders: {
      "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
      "X-OpenRouter-Title": "RouterChat",
    }
  });
}
