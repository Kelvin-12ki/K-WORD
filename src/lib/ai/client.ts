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

  let raw: string;
  try {
    const response = await ai.chat.completions.create({
      ...base,
      response_format: { type: "json_object" },
    });
    raw = response.choices[0]?.message?.content ?? "";
  } catch (err) {
    // Some OpenAI-compatible backends reject response_format; retry without it.
    if (!isResponseFormatError(err)) throw err;
    const response = await ai.chat.completions.create(base);
    raw = response.choices[0]?.message?.content ?? "";
  }

  return parseJSON<T>(raw);
}

function isResponseFormatError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("response_format") ||
    msg.includes("response schema") ||
    msg.includes("json_object") ||
    msg.includes("json schema")
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
