import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import {
  createChatSession,
  getChatSessionsByUser,
  getChatSessionById,
  updateChatSession,
  deleteChatSession,
  createMessage,
  getMessagesBySession,
  getUserById,
  searchSimilarChunks,
} from "../storage";
import { streamChatResponse } from "../services/claude";
import { generateEmbedding } from "../services/embeddings";
import { searchIslamicWeb } from "../services/websearch";

const router = Router();

// Create new chat session
router.post(
  "/sessions",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const session = await createChatSession({
        userId: req.userId!,
        title: req.body.title || "New Chat",
      });
      res.status(201).json(session);
    } catch (error) {
      console.error("Create session error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// List user's chat sessions
router.get(
  "/sessions",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const sessions = await getChatSessionsByUser(req.userId!);
      res.json(sessions);
    } catch (error) {
      console.error("List sessions error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get session with messages
router.get(
  "/sessions/:id",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const session = await getChatSessionById(req.params.id);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      if (session.userId !== req.userId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const msgs = await getMessagesBySession(session.id);
      res.json({ ...session, messages: msgs });
    } catch (error) {
      console.error("Get session error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Delete session
router.delete(
  "/sessions/:id",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const session = await getChatSessionById(req.params.id);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      if (session.userId !== req.userId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      await deleteChatSession(session.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete session error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Send message (triggers Claude API + SSE streaming response)
router.post(
  "/sessions/:id/messages",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { content } = req.body;
      if (!content) {
        res.status(400).json({ error: "Message content is required" });
        return;
      }

      const session = await getChatSessionById(req.params.id);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      if (session.userId !== req.userId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const user = await getUserById(req.userId!);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Save user message
      await createMessage({
        sessionId: session.id,
        role: "user",
        content,
      });

      // Auto-title from first message
      if (session.title === "New Chat") {
        const title =
          content.length > 60 ? content.substring(0, 57) + "..." : content;
        await updateChatSession(session.id, { title });
      }

      // Get conversation history
      const history = await getMessagesBySession(session.id);
      const conversationHistory = history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // Run local RAG search and web search in parallel
      const queryEmbedding = await generateEmbedding(content);
      const [localChunks, webResults] = await Promise.all([
        searchSimilarChunks(queryEmbedding, {
          madhab: user.madhab || undefined,
          country: user.country || undefined,
          limit: 6,
        }),
        searchIslamicWeb(content, user.madhab || undefined),
      ]);

      // Combine: local knowledge base first, then web results
      const relevantChunks = [...localChunks, ...webResults];

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let fullResponse = "";

      // Stream AI response
      for await (const chunk of streamChatResponse(
        content,
        conversationHistory.slice(0, -1), // exclude the just-added user message since we pass it separately
        user.madhab || "hanafi",
        user.country || "SA",
        relevantChunks
      )) {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }

      // Save assistant message
      await createMessage({
        sessionId: session.id,
        role: "assistant",
        content: fullResponse,
      });

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Send message error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.write(
          `data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`
        );
        res.end();
      }
    }
  }
);

export default router;
