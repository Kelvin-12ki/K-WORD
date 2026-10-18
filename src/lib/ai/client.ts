import OpenAI from "openai";
import { OPENAI_MODELS } from "@/lib/constants";

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export function aiAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function chatJSON<T>(params: {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<T> {
  const openai = getOpenAI();
  if (!openai) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Add it to .env.local to enable AI features."
    );
  }

  const response = await openai.chat.completions.create({
    model: OPENAI_MODELS.chat,
    temperature: params.temperature ?? 0.7,
    max_tokens: params.maxTokens ?? 1200,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: params.system },
      { role: "user", content: params.user },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error("AI returned an unexpected response. Please try again.");
  }
}
