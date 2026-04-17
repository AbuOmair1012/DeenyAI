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

export interface RetrievedChunk {
  content: string;
  source: string;
  title: string;
  author?: string | null;
  similarity?: number;
  url?: string;
  isWeb?: boolean;
}

function buildSystemPrompt(
  madhab: string,
  country: string,
  chunks: RetrievedChunk[]
): string {
  const madhabLabel = MADHAB_LABELS[madhab as Madhab]?.en || madhab;

  const hasWebSources = chunks.some((c) => c.isWeb);
  const hasAnySources = chunks.length > 0;

  let sourcesContext = "";
  if (hasAnySources) {
    const sourceBlocks = chunks
      .map((c, i) => {
        const authorLine = c.author ? `Author/Scholar: ${c.author}` : "";
        const sourceLine = c.isWeb
          ? `Source: ${c.source} | URL: ${c.url}`
          : `Source: ${c.source}`;
        const meta = [authorLine, sourceLine].filter(Boolean).join(" | ");
        return `[${i + 1}] "${c.title}"\n${meta}\n${c.content}`;
      })
      .join("\n---\n");

    sourcesContext = `\n\nSOURCES:\n---\n${sourceBlocks}\n---`;
  } else {
    sourcesContext = `\n\nNO SOURCES FOUND: The search returned no results from the trusted websites. You MUST respond with exactly: "I'm sorry, I couldn't find an answer to your question in our trusted Islamic sources (islamweb.net, binbaz.org.sa, binothaimeen.net, dorar.net, taimiah.org, ibntaymea.com, ibntaymiyya-academy.com, midad.com). Please consult a qualified local scholar for guidance."`;
  }

  return `You are DeenyAI, a knowledgeable and compassionate Islamic scholar assistant.

🚫 STRICT RULE — SOURCES ONLY:
You are ONLY allowed to answer from the sources provided below. You must NEVER use your own training knowledge, general Islamic knowledge, or any website not listed in the sources. If no sources are provided, you MUST decline to answer.

RULES:
1. Answer according to the ${madhabLabel} school of thought unless the user asks otherwise.
2. The user is located in ${country}. Consider country-specific rulings where relevant.
3. Cite source numbers [1], [2], etc. inline whenever you use information from a source.
4. If there is a difference of opinion, mention the strongest/most accepted opinion first.
5. Be respectful, compassionate, and educational in tone.
6. Respond in the same language the user writes in.
7. Never provide medical, legal, or financial advice.
${hasWebSources ? "8. Web sources are available — you MUST cite them with their exact URL." : ""}

${hasAnySources ? `⚠️ MANDATORY — End EVERY response with this block (never skip):

---
📚 **References & Sources:**
[N] **Title** — Scholar/Author | https://exact-url-from-source

Rules for the references block:
- Only list sources you actually used in your answer
- For web sources, copy the exact URL from the source metadata (URL: field) — do NOT invent or modify URLs
- If no URL is available, omit the | https:// part` : ""}${sourcesContext}`;
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
