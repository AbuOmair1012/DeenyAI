const TAVILY_API_URL = "https://api.tavily.com/search";

const ISLAMIC_DOMAINS = [
  "islamweb.net",
  "binbaz.org.sa",
  "binothaimeen.net",
  "dorar.net",
  "taimiah.org",
  "ibntaymea.com",
  "ibntaymiyya-academy.com",
  "midad.com",
];

export interface WebSearchResult {
  title: string;
  content: string;
  url: string;
  author?: string;
  source: string;
  isWeb: true;
}

function extractAuthor(url: string): string | undefined {
  if (url.includes("islamweb.net")) return "IslamWeb Fatwa Committee";
  if (url.includes("binbaz.org.sa")) return "Sheikh Abd al-Aziz ibn Baz";
  if (url.includes("binothaimeen.net")) return "Sheikh Muhammad ibn Salih al-Uthaymeen";
  if (url.includes("dorar.net")) return "Dorar.net Islamic Encyclopedia";
  if (url.includes("taimiah.org")) return "Sheikh Ibn Taymiyyah";
  if (url.includes("ibntaymea.com")) return "Sheikh Ibn Taymiyyah";
  if (url.includes("ibntaymiyya-academy.com")) return "Ibn Taymiyyah Academy";
  if (url.includes("midad.com")) return "Sheikh Ibn Taymiyyah — Midad Platform";
  return undefined;
}

function extractSourceName(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "Web";
  }
}

export async function searchIslamicWeb(
  query: string,
  madhab?: string
): Promise<WebSearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.warn("TAVILY_API_KEY not set — skipping web search");
    return [];
  }

  const madhabSuffix = madhab && madhab !== "general" ? ` ${madhab} school of thought` : "";

  try {
    const response = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: `Islamic ruling ${query}${madhabSuffix}`,
        search_depth: "advanced",
        include_domains: ISLAMIC_DOMAINS,
        max_results: 6,
        include_answer: false,
      }),
    });

    if (!response.ok) {
      console.error("Tavily search failed:", response.status);
      return [];
    }

    const data = await response.json();

    return (data.results || []).map((r: any) => ({
      title: r.title || "Islamic Reference",
      content: (r.content || "").substring(0, 800),
      url: r.url,
      author: extractAuthor(r.url),
      source: extractSourceName(r.url),
      isWeb: true as const,
    }));
  } catch (err) {
    console.error("Web search error:", err);
    return [];
  }
}
