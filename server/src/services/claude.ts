import OpenAI from "openai";
import { MADHAB_LABELS, type Madhab } from "@deenyai/shared";

let _deepseek: OpenAI;

export function getDeepSeek() {
  if (!_deepseek) _deepseek = new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: process.env.DEEPSEEK_API_KEY!,
  });
  return _deepseek;
}

interface RetrievedChunk {
  content: string;
  source: string;
  title: string;
  similarity: number;
}

function buildSystemPrompt(
  madhab: string,
  country: string,
  chunks: RetrievedChunk[]
): string {
  const madhabLabel =
    MADHAB_LABELS[madhab as Madhab]?.en || madhab;

  let sourcesContext = "";
  if (chunks.length > 0) {
    const sourceBlocks = chunks
      .map(
        (c, i) =>
          `[${i + 1}] "${c.title}" (Source: ${c.source})\n${c.content}`
      )
      .join("\n---\n");

    sourcesContext = `\n\nSOURCES FROM KNOWLEDGE BASE:\n---\n${sourceBlocks}\n---`;
  }

  return `You are DeenyAI, a knowledgeable and compassionate Islamic scholar assistant.

CRITICAL RULE: You must answer ONLY based on the sources provided below. Do NOT use any outside knowledge or general information. If the provided sources do not contain enough information to answer the question, clearly state: "I don't have enough information in my knowledge base to answer this question. Please consult a local scholar."

ADDITIONAL RULES:
1. Always answer according to the ${madhabLabel} school of thought (madhhab) unless the user explicitly asks about another school.
2. The user is located in ${country}. Consider any country-specific rulings relevant to their location.
3. Cite the source numbers [1], [2], etc. when referencing information from the provided sources.
4. If there is a difference of opinion among scholars within the ${madhabLabel} school, mention the strongest/most accepted opinion first.
5. Be respectful, compassionate, and educational in tone.
6. Respond in the same language the user writes in.
7. Never provide medical, legal, or financial advice — only Islamic scholarly guidance.${sourcesContext}`;
}

export async function* streamChatResponse(
  userMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[],
  madhab: string,
  country: string,
  chunks: RetrievedChunk[]
): AsyncGenerator<string> {
  const systemPrompt = buildSystemPrompt(madhab, country, chunks);

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  const stream = await getDeepSeek().chat.completions.create({
    model: "deepseek-chat",
    messages,
    stream: true,
    max_tokens: 2048,
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) {
      yield text;
    }
  }
}
