import { chatJSON, aiAvailable } from "@/lib/ai/client";

export interface EnrichmentResult {
  pronunciation: string;
  partOfSpeech: string;
  synonyms: string[];
  antonyms: string[];
  refinedMeaning: string;
  examples: { context: string; sentence: string }[];
  source?: "ai" | "fallback";
}

export interface EvaluationResult {
  score: number;
  grammarScore: number;
  naturalnessScore: number;
  contextScore: number;
  feedback: string;
  suggestion: string;
}

export interface ConversationTurn {
  speaker: "ai" | "user";
  text: string;
  usedWords: string[];
}

export interface ConversationResult {
  opening: string;
  targetWords: string[];
  suggestedReply: string;
}

export interface WritingAnalysis {
  vocabularyDiversity: number;
  repetitionScore: number;
  strengthScore: number;
  repeatedWords: { word: string; count: number }[];
  weakPhrases: { phrase: string; suggestion: string }[];
  suggestions: { original: string; replacement: string; reason: string }[];
  summary: string;
}

const CONTEXTS = ["Professional", "Business", "Academic", "Daily"] as const;

function pickFallbackWord(word: string, meaning?: string): EnrichmentResult {
  const w = word.trim();
  const article = /^[aeiou]/i.test(w) ? "an" : "a";
  return {
    pronunciation: `/${w.toLowerCase().replace(/[^a-z]/g, "").split("").join("·")}/`,
    partOfSpeech: "adjective",
    synonyms: ["notable", "significant", "relevant"],
    antonyms: ["minor", "trivial", "irrelevant"],
    refinedMeaning:
      meaning?.trim() || `${w} — ${article} term worth adding to your active vocabulary.`,
    examples: CONTEXTS.map((context) => ({
      context,
      sentence: `The team applied ${w} during the ${context.toLowerCase()} review to improve the outcome.`,
    })),
  };
}

export async function enrichWord(input: {
  word: string;
  meaning?: string;
  category?: string;
}): Promise<EnrichmentResult & { source: "ai" | "fallback" }> {
  const fallback = { ...pickFallbackWord(input.word), source: "fallback" as const };
  if (!aiAvailable()) return fallback;

  try {
    const data = await chatJSON<{
      pronunciation: string;
      partOfSpeech: string;
      synonyms: string[];
      antonyms: string[];
      refinedMeaning: string;
      examples: { context: string; sentence: string }[];
    }>({
      system:
        "You are a lexicographer for the K WORD vocabulary platform. Respond ONLY with valid JSON matching the requested schema. Be concise and precise.",
      user: `Enrich this vocabulary entry.
Word: ${input.word}
${input.meaning ? `User meaning: ${input.meaning}` : ""}
${input.category ? `Category: ${input.category}` : ""}

JSON schema:
{
  "pronunciation": "IPA style string",
  "partOfSpeech": "e.g. noun, verb, adjective",
  "synonyms": ["3-5 synonyms"],
  "antonyms": ["2-4 antonyms"],
  "refinedMeaning": "clear dictionary-style definition",
  "examples": [
    {"context":"Professional","sentence":"..."},
    {"context":"Business","sentence":"..."},
    {"context":"Academic","sentence":"..."},
    {"context":"Daily","sentence":"..."}
  ]
}`,
      temperature: 0.4,
    });

    const examples = (data.examples ?? []).slice(0, 6).map((e, i) => ({
      context: e.context || CONTEXTS[i % CONTEXTS.length],
      sentence: e.sentence,
    }));

    return {
      pronunciation: data.pronunciation || fallback.pronunciation,
      partOfSpeech: data.partOfSpeech || fallback.partOfSpeech,
      synonyms: (data.synonyms ?? []).slice(0, 8),
      antonyms: (data.antonyms ?? []).slice(0, 6),
      refinedMeaning: data.refinedMeaning || input.meaning || input.word,
      examples: examples.length ? examples : fallback.examples,
      source: "ai",
    };
  } catch {
    return fallback;
  }
}

export async function evaluateSentence(input: {
  word: string;
  meaning: string;
  sentence: string;
}): Promise<EvaluationResult & { source: "ai" | "fallback" }> {
  const wordUsed = input.sentence.toLowerCase().includes(input.word.toLowerCase());
  const words = input.sentence.trim().split(/\s+/).length;
  const fallback: EvaluationResult & { source: "fallback" } = {
    score: wordUsed ? (words >= 8 ? 8 : 6) : 3,
    grammarScore: wordUsed ? 8 : 5,
    naturalnessScore: wordUsed ? 7 : 5,
    contextScore: wordUsed ? 8 : 3,
    feedback: wordUsed
      ? `You used "${input.word}" correctly in context. Try varying sentence structure to make it sound even more natural.`
      : `Your sentence does not include "${input.word}". Make sure the target word appears naturally.`,
    suggestion: `Try: "The ${input.word.toLowerCase()} approach helped us deliver results faster."`,
    source: "fallback",
  };
  if (!aiAvailable()) return fallback;

  try {
    const data = await chatJSON<EvaluationResult>({
      system:
        "You are an exacting but encouraging English writing coach for K WORD. Respond ONLY with valid JSON.",
      user: `Evaluate this sentence for correct usage of the target word.

Target word: "${input.word}"
Word meaning: ${input.meaning}
User's sentence: "${input.sentence}"

Return JSON:
{
  "score": number 0-10 overall,
  "grammarScore": number 0-10,
  "naturalnessScore": number 0-10,
  "contextScore": number 0-10,
  "feedback": "1-2 sentences of specific feedback",
  "suggestion": "one improved, more natural sentence using the word"
}`,
      temperature: 0.3,
      maxTokens: 500,
    });

    const clamp = (n: unknown) => Math.max(0, Math.min(10, Math.round(Number(n) || 0)));
    return {
      score: clamp(data.score),
      grammarScore: clamp(data.grammarScore),
      naturalnessScore: clamp(data.naturalnessScore),
      contextScore: clamp(data.contextScore),
      feedback: data.feedback || fallback.feedback,
      suggestion: data.suggestion || fallback.suggestion,
      source: "ai",
    };
  } catch {
    return fallback;
  }
}

export async function generateConversation(input: {
  topic: string;
  words: { word: string; meaning: string }[];
  turnCount: number;
}): Promise<ConversationResult & { source: "ai" | "fallback" }> {
  const wordList = input.words.map((w) => w.word);
  const fallback: ConversationResult & { source: "fallback" } = {
    opening: `Welcome to the ${input.topic.toLowerCase()} discussion. Today we'll explore ${wordList.slice(0, 3).join(", ") || "key ideas"} in a realistic setting. What would you like to start with?`,
    targetWords: wordList,
    suggestedReply: wordList[0]
      ? `In my view, a ${wordList[0].toLowerCase()} strategy would help us address the main challenge here.`
      : "I think we should start by defining the problem clearly.",
    source: "fallback",
  };
  if (!aiAvailable()) return fallback;

  try {
    const data = await chatJSON<ConversationResult>({
      system:
        "You are the conversation partner in K WORD's Word Playground. You speak naturally as a domain expert. Respond ONLY with valid JSON.",
      user: `Create the opening turn of a realistic ${input.topic} conversation that naturally weaves in the user's saved vocabulary words without forcing them.

Saved words to include: ${input.words
        .map((w) => `"${w.word}" (${w.meaning})`)
        .join("; ")}

Return JSON:
{
  "opening": "your opening message (2-4 sentences, natural, includes at least 2 target words)",
  "targetWords": ["words actually used in the opening"],
  "suggestedReply": "a sample reply the user could send that uses one target word correctly"
}`,
      temperature: 0.8,
      maxTokens: 700,
    });

    return {
      opening: data.opening || fallback.opening,
      targetWords: data.targetWords?.length ? data.targetWords : wordList,
      suggestedReply: data.suggestedReply || fallback.suggestedReply,
      source: "ai",
    };
  } catch {
    return fallback;
  }
}

export async function continueConversation(input: {
  topic: string;
  history: { speaker: "ai" | "user"; text: string }[];
  words: { word: string; meaning: string }[];
}): Promise<{ reply: string; usedWords: string[]; source: "ai" | "fallback" }> {
  const fallbackReply = `That's a ${input.topic.toLowerCase()} point. How would you apply it with a more ${
    input.words[0]?.word.toLowerCase() || "practical"
  } approach?`;
  if (!aiAvailable()) {
    return { reply: fallbackReply, usedWords: input.words.slice(0, 1).map((w) => w.word), source: "fallback" };
  }

  try {
    const history = input.history
      .map((h) => `${h.speaker === "ai" ? "Partner" : "User"}: ${h.text}`)
      .join("\n");
    const data = await chatJSON<{ reply: string; usedWords: string[] }>({
      system:
        "You are a natural conversation partner in K WORD's Word Playground. Keep replies under 80 words and continue the discussion. Respond ONLY with JSON.",
      user: `Topic: ${input.topic}
Vocabulary to keep using naturally: ${input.words.map((w) => `"${w.word}"`).join(", ")}

Conversation so far:
${history}

Reply as the partner. Return JSON: { "reply": "...", "usedWords": ["words you used from the list"] }`,
      temperature: 0.8,
      maxTokens: 400,
    });
    return {
      reply: data.reply || fallbackReply,
      usedWords: data.usedWords ?? [],
      source: "ai",
    };
  } catch {
    return { reply: fallbackReply, usedWords: [], source: "fallback" };
  }
}

const WEAK_MAP: Record<string, string[]> = {
  good: ["effective", "robust", "sound", "practical"],
  bad: ["weak", "flawed", "ineffective", "problematic"],
  big: ["substantial", "significant", "considerable", "extensive"],
  small: ["minor", "limited", "modest", "negligible"],
  important: ["critical", "essential", "crucial", "pivotal"],
  help: ["facilitate", "enable", "support", "accelerate"],
  use: ["leverage", "apply", "utilize", "employ"],
  show: ["demonstrate", "illustrate", "evidence", "reflect"],
  think: ["consider", "assess", "evaluate", "believe"],
  make: ["build", "construct", "produce", "establish"],
  very: ["highly", "particularly", "exceptionally", "markedly"],
  thing: ["factor", "element", "aspect", "consideration"],
  get: ["obtain", "acquire", "receive", "derive"],
  problem: ["challenge", "issue", "constraint", "obstacle"],
  way: ["approach", "method", "pathway", "mechanism"],
};

export async function analyzeWriting(input: {
  text: string;
  type: string;
  savedWords: { word: string; meaning: string }[];
}): Promise<WritingAnalysis & { source: "ai" | "fallback" }> {
  const tokens = input.text.toLowerCase().match(/[a-z']+/g) ?? [];
  const stop = new Set(
    "the a an and or but if then than that this these those is are was were be been being to of in on for with as by at from it its i we you they he she will would can could should may might must have has had do does did not no yes so such into over under about".split(
      " "
    )
  );
  const freq = new Map<string, number>();
  for (const t of tokens) {
    if (t.length < 3 || stop.has(t)) continue;
    freq.set(t, (freq.get(t) ?? 0) + 1);
  }
  const repeated = [...freq.entries()]
    .filter(([, c]) => c >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, count]) => ({ word, count }));

  const diversity = tokens.length ? (freq.size / tokens.length) * 100 : 0;
  const weakPhrases: { phrase: string; suggestion: string }[] = [];
  const suggestions: { original: string; replacement: string; reason: string }[] = [];

  for (const [weak, replacements] of Object.entries(WEAK_MAP)) {
    const regex = new RegExp(`\\b${weak}\\b`, "gi");
    const matches = input.text.match(regex);
    if (!matches) continue;
    const replacement =
      input.savedWords.find((w) => replacements.includes(w.word.toLowerCase()))?.word ??
      replacements[0];
    weakPhrases.push({ phrase: weak, suggestion: replacement });
    suggestions.push({
      original: weak,
      replacement,
      reason: `"${weak}" is overused. "${replacement}" is more precise${
        input.savedWords.some((w) => w.word.toLowerCase() === replacement.toLowerCase())
          ? " and already in your vocabulary bank"
          : ""
      }.`,
    });
  }

  const analysis: WritingAnalysis = {
    vocabularyDiversity: Math.min(100, Math.round(diversity * 1.4)),
    repetitionScore: Math.max(0, 100 - repeated.length * 12),
    strengthScore: Math.min(
      100,
      Math.round(40 + Math.min(30, suggestions.length * 6) + Math.min(30, diversity / 2))
    ),
    repeatedWords: repeated,
    weakPhrases: weakPhrases.slice(0, 10),
    suggestions: suggestions.slice(0, 10),
    summary: `Your ${input.type} uses ${
      freq.size
    } distinct content words across ${tokens.length} words. ${
      repeated.length
        ? `Watch repeated terms like ${repeated
            .slice(0, 3)
            .map((r) => `"${r.word}"`)
            .join(", ")}.`
        : "Repetition is well controlled."
    }`,
  };

  if (!aiAvailable()) return { ...analysis, source: "fallback" };

  try {
    const savedList = input.savedWords.slice(0, 60).map((w) => w.word).join(", ");
    const data = await chatJSON<Partial<WritingAnalysis>>({
      system:
        "You are the K WORD writing analyst. Respond ONLY with valid JSON. Improve the automated analysis with sharper, contextual suggestions.",
      user: `Analyze this ${input.type} for vocabulary quality.

Text:
"""
${input.text.slice(0, 8000)}
"""

User's saved vocabulary (prefer suggesting these when suitable): ${savedList}

Return JSON:
{
  "summary": "2-3 sentence analysis",
  "suggestions": [{"original":"word/phrase","replacement":"stronger alternative","reason":"why"}],
  "vocabularyDiversity": number 0-100,
  "repetitionScore": number 0-100,
  "strengthScore": number 0-100
}`,
      temperature: 0.4,
      maxTokens: 1200,
    });

    return {
      vocabularyDiversity: Math.min(100, Math.round(Number(data.vocabularyDiversity) || analysis.vocabularyDiversity)),
      repetitionScore: Math.min(100, Math.round(Number(data.repetitionScore) || analysis.repetitionScore)),
      strengthScore: Math.min(100, Math.round(Number(data.strengthScore) || analysis.strengthScore)),
      repeatedWords: analysis.repeatedWords,
      weakPhrases: analysis.weakPhrases,
      suggestions: (data.suggestions?.length ? data.suggestions : analysis.suggestions).slice(0, 12),
      summary: data.summary || analysis.summary,
      source: "ai",
    };
  } catch {
    return { ...analysis, source: "fallback" };
  }
}

export async function suggestMeaning(word: string): Promise<string> {
  if (!aiAvailable()) return "";
  try {
    const data = await chatJSON<{ meaning: string }>({
      system: "You are a dictionary. Respond ONLY with JSON.",
      user: `Give a concise 1-2 sentence definition as JSON: { "meaning": "..." } for the word: ${word}`,
      temperature: 0.2,
      maxTokens: 200,
    });
    return data.meaning || "";
  } catch {
    return "";
  }
}
