import Anthropic from "@anthropic-ai/sdk";
import type { Reference, Message } from "@deenyai/shared";
import { MADHAB_LABELS, type Madhab } from "@deenyai/shared";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function buildSystemPrompt(
  madhab: string,
  country: string,
  relevantRefs: Reference[]
): string {
  const madhabLabel =
    MADHAB_LABELS[madhab as Madhab]?.en || madhab;

  let refContext = "";
  if (relevantRefs.length > 0) {
    const refBlocks = relevantRefs
      .map(
        (r, i) =>
          `[${i + 1}] ${r.title} (Source: ${r.source}, Type: ${r.sourceType})\n${r.content}`
      )
      .join("\n---\n");

    refContext = `\n\nRELEVANT REFERENCES FROM VERIFIED SOURCES:\n---\n${refBlocks}\n---\nUse these references to inform your answer. Cite them by number when applicable.\nIf these references do not cover the question, use your general knowledge but clearly indicate which parts are from verified sources vs. general knowledge.`;
  }

  return `You are DeenyAI, a knowledgeable and compassionate Islamic scholar assistant. You provide answers grounded in authentic Islamic scholarship.

IMPORTANT RULES:
1. Always answer according to the ${madhabLabel} school of thought (madhhab) unless the user explicitly asks about another school.
2. The user is located in ${country}. Consider any country-specific rulings or fatwa council decisions relevant to their location.
3. Always cite your sources. Reference specific Quran verses (with surah and ayah numbers), hadith (with collection and narrator), or scholarly works.
4. If there is a difference of opinion among scholars within the ${madhabLabel} school, mention the strongest/most accepted opinion first, then note alternatives.
5. If the question falls outside Islamic jurisprudence or you are uncertain, clearly state that and recommend the user consult a local scholar.
6. Be respectful, compassionate, and educational in tone.
7. Format references clearly at the end of your response.
8. Respond in the same language the user writes in.
9. Never provide medical, legal, or financial advice — only Islamic scholarly guidance.${refContext}`;
}

export async function* streamChatResponse(
  userMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[],
  madhab: string,
  country: string,
  relevantRefs: Reference[]
): AsyncGenerator<string> {
  const systemPrompt = buildSystemPrompt(madhab, country, relevantRefs);

  const messagesForApi = conversationHistory.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Add the current user message
  messagesForApi.push({ role: "user", content: userMessage });

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: systemPrompt,
    messages: messagesForApi,
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}
