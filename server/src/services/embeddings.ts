// Simple local text embedding using hash-based approach
// No external API needed - works offline and is fast
// Produces 256-dimensional vectors using character n-gram hashing

const DIMENSIONS = 256;

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

function tokenize(text: string): string[] {
  // Normalize: lowercase, remove diacritics for Arabic
  const normalized = text.toLowerCase().normalize("NFKD");

  const tokens: string[] = [];

  // Word tokens
  const words = normalized.split(/\s+/).filter(w => w.length > 1);
  tokens.push(...words);

  // Character 3-grams for better fuzzy matching
  for (const word of words) {
    for (let i = 0; i <= word.length - 3; i++) {
      tokens.push(word.slice(i, i + 3));
    }
  }

  // Word bigrams
  for (let i = 0; i < words.length - 1; i++) {
    tokens.push(`${words[i]} ${words[i + 1]}`);
  }

  return tokens;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const vector = new Float64Array(DIMENSIONS);
  const tokens = tokenize(text);

  for (const token of tokens) {
    const hash = Math.abs(hashCode(token));
    const index = hash % DIMENSIONS;
    const sign = (hash >> 16) % 2 === 0 ? 1 : -1;
    vector[index] += sign;
  }

  // L2 normalize
  let norm = 0;
  for (let i = 0; i < DIMENSIONS; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < DIMENSIONS; i++) {
      vector[i] /= norm;
    }
  }

  return Array.from(vector);
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    results.push(await generateEmbedding(text));
  }
  return results;
}
