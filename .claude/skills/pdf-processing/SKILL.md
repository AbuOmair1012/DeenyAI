---
name: pdf-processing
description: Islamic PDF upload and RAG pipeline. Use when uploading Islamic texts (PDFs), processing document chunks, generating embeddings, storing in the knowledge base, or searching similar chunks for context injection. Keywords: PDF upload, Islamic text, document chunks, embeddings, RAG, knowledge base, vector search.
---

# Islamic PDF → RAG Pipeline

When working on PDF upload, chunking, embedding, or RAG search in this project, follow this pipeline and always reuse the existing implementations below.

## Pipeline Steps

### 1. Upload
- PDF arrives via admin route (`/api/admin/*`) as multipart form data
- Create a `references` row **first** (table name: `references`, not `references_`) before inserting any chunks

### 2. Extract + Chunk
Use `extractAndChunk()` from `server/src/services/pdf.ts`:
```ts
import { extractAndChunk } from "../services/pdf";

const chunks = await extractAndChunk(pdfBuffer);
// Returns: { content: string, pageNumber: number }[]
// Defaults: chunkSize=500, overlap=100
```
- Splits text on paragraphs, respects page boundaries
- Overlap ensures context isn't lost at chunk boundaries

### 3. Embed
Use `generateEmbedding()` from `server/src/services/embeddings.ts`:
```ts
import { generateEmbedding } from "../services/embeddings";

const embedding = await generateEmbedding(chunk.content);
// Returns: number[] — 256-dimensional L2-normalized vector
```
- **Never use external embedding APIs** — the hash-based approach is intentional (offline, fast, no cost)
- Arabic-aware: normalizes via NFKD + lowercases; uses character 3-grams + word bigrams
- 256 dimensions

### 4. Store
Use `insertChunks()` from `server/src/storage.ts`:
```ts
import { insertChunks } from "../storage";

await insertChunks(chunks.map((chunk, i) => ({
  referenceId,        // FK → references.id (create this row first)
  content: chunk.content,
  pageNumber: chunk.pageNumber,
  embedding: embedding[i],  // stored as JSONB array, NOT pgvector
})));
```
- Bulk inserts in batches of 50
- Table: `document_chunks`; embedding column type: JSONB array of floats

### 5. Search (at chat time)
Use `searchSimilarChunks()` from `server/src/storage.ts`:
```ts
import { searchSimilarChunks } from "../storage";

const results = await searchSimilarChunks(queryEmbedding, {
  madhab: "hanafi",   // optional
  country: "EG",      // optional
  limit: 8,           // default: top-8 injected as context
});
// Returns: { content, source, title, author, similarity }[]
```
- Custom SQL cosine similarity via `unnest()` on JSONB float arrays (not pgvector)
- Filters: `references.isActive = true`, optionally madhab/country
- Top results are injected into the DeepSeek system prompt as Islamic source context

## Key Constraints
- **Table name**: `document_chunks` (never `document_chunks_`)
- **References table**: `references` (never `references_`)
- **Embeddings**: JSONB arrays — not pgvector, not a separate extension
- **Always create `references` row before inserting chunks** — chunks FK to it
- **No external APIs for embeddings** — hash-based only
