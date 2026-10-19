import OpenAI from "openai";
import type { ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions";
import { AI_MODELS } from "@/lib/constants";

let client: OpenAI | null = null;

export function aiAvailable(): boolean {
  return Boolean(process.env.AI_API_KEY || process.env.OPENAI_API_KEY);
}

export function getAI(): OpenAI | null {
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  if (!client) {
    client = new OpenAI({
      apiKey,
      baseURL: process.env.AI_BASE_URL?.trim() || undefined,
    });
  }
  return client;
}

/** @deprecated use getAI() */
export const getOpenAI = getAI;

export async function chatJSON<T>(params: {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<T> {
  const ai = getAI();
  if (!ai) {
    throw new Error(
      "AI_API_KEY is not configured. Add it to enable AI features."
    );
  }

  // Reasoning models spend most of their latency thinking. Set
  // AI_REASONING_EFFORT (e.g. "none") to keep responses interactive.
  const effort = process.env.AI_REASONING_EFFORT?.trim() as
    | ChatCompletionCreateParamsNonStreaming["reasoning_effort"]
    | undefined;

  const base: ChatCompletionCreateParamsNonStreaming = {
    model: AI_MODELS.chat,
    temperature: params.temperature ?? 0.7,
    max_tokens: params.maxTokens ?? 1200,
    messages: [
      { role: "system", content: params.system },
      { role: "user", content: params.user },
    ],
  };
  if (effort) base.reasoning_effort = effort;

  const withoutReasoning = { ...base };
  delete (withoutReasoning as Record<string, unknown>).reasoning_effort;

  // Not every OpenAI-compatible backend supports every optional field, so
  // degrade by dropping optional params instead of failing the request.
  const attempts: ChatCompletionCreateParamsNonStreaming[] = [
    { ...base, response_format: { type: "json_object" } },
    base,
    withoutReasoning,
  ];

  let lastError: unknown;
  for (const body of attempts) {
    try {
      const response = await ai.chat.completions.create(body);
      const raw = response.choices[0]?.message?.content ?? "";
      if (!raw.trim()) throw new Error("AI returned an empty response. Please try again.");
      return parseJSON<T>(raw);
    } catch (err) {
      if (!isBadRequest(err)) throw err;
      lastError = err;
    }
  }
  throw lastError;
}

function isBadRequest(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if ((err as { status?: number }).status === 400) return true;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("invalid argument") ||
    msg.includes("unknown parameter") ||
    msg.includes("response_format") ||
    msg.includes("json_object") ||
    msg.includes("reasoning_effort")
  );
}

function parseJSON<T>(raw: string): T {
  const text = extractJSON(raw);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("AI returned an unexpected response. Please try again.");
  }
}

function extractJSON(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("```")) {
    const fenced = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    return fenced.trim();
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}
