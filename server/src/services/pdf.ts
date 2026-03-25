import { PDFParse } from "pdf-parse";

interface ChunkResult {
  content: string;
  pageNumber: number;
}

export async function extractAndChunk(
  pdfBuffer: Buffer,
  chunkSize = 500,
  overlap = 100
): Promise<ChunkResult[]> {
  const parser = new PDFParse({ data: pdfBuffer });
  const result = await parser.getText();
  const text = result.pages.map((p: { text: string }) => p.text).join("\f");

  if (!text || text.trim().length === 0) {
    throw new Error("PDF contains no extractable text");
  }

  // Split into paragraphs first
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  const chunks: ChunkResult[] = [];
  let currentChunk = "";
  let currentPage = 1;

  // Estimate page boundaries from the raw text
  const pages = text.split(/\f/); // Form feed character separates pages in pdf-parse
  const pageStartPositions: number[] = [];
  let pos = 0;
  for (const page of pages) {
    pageStartPositions.push(pos);
    pos += page.length + 1;
  }

  function getPageNumber(textPosition: number): number {
    for (let i = pageStartPositions.length - 1; i >= 0; i--) {
      if (textPosition >= pageStartPositions[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  let textPosition = 0;

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    // Find this paragraph's position in the original text
    const paragraphPos = text.indexOf(trimmed, textPosition);
    if (paragraphPos >= 0) {
      textPosition = paragraphPos;
      currentPage = getPageNumber(paragraphPos);
    }

    if (currentChunk.length + trimmed.length > chunkSize && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        content: currentChunk.trim(),
        pageNumber: currentPage,
      });

      // Start new chunk with overlap from end of previous
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + " " + trimmed;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + trimmed;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      pageNumber: currentPage,
    });
  }

  return chunks;
}
