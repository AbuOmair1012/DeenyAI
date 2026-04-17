// Stub for packages that can't run in Cloudflare Workers
export class PDFParse {
  constructor(_opts?: any) {}
  async getText(): Promise<{ pages: { text: string }[] }> {
    return { pages: [] };
  }
}
export default {};
