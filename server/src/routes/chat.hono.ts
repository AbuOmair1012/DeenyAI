import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { authenticate, type AuthVariables } from "../middleware/auth.hono";
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

const app = new Hono<{ Variables: AuthVariables }>();

// Create new chat session
app.post("/sessions", authenticate, async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const session = await createChatSession({
      userId: c.get("userId"),
      title: body.title || "New Chat",
    });
    return c.json(session, 201);
  } catch (error) {
    console.error("Create session error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// List user's chat sessions
app.get("/sessions", authenticate, async (c) => {
  try {
    const sessions = await getChatSessionsByUser(c.get("userId"));
    return c.json(sessions);
  } catch (error) {
    console.error("List sessions error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get session with messages
app.get("/sessions/:id", authenticate, async (c) => {
  try {
    const session = await getChatSessionById(c.req.param("id"));
    if (!session) return c.json({ error: "Session not found" }, 404);
    if (session.userId !== c.get("userId")) return c.json({ error: "Access denied" }, 403);

    const msgs = await getMessagesBySession(session.id);
    return c.json({ ...session, messages: msgs });
  } catch (error) {
    console.error("Get session error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Delete session
app.delete("/sessions/:id", authenticate, async (c) => {
  try {
    const session = await getChatSessionById(c.req.param("id"));
    if (!session) return c.json({ error: "Session not found" }, 404);
    if (session.userId !== c.get("userId")) return c.json({ error: "Access denied" }, 403);

    await deleteChatSession(session.id);
    return c.body(null, 204);
  } catch (error) {
    console.error("Delete session error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Send message (SSE streaming)
app.post("/sessions/:id/messages", authenticate, async (c) => {
  const { content } = await c.req.json();
  if (!content) return c.json({ error: "Message content is required" }, 400);

  const session = await getChatSessionById(c.req.param("id"));
  if (!session) return c.json({ error: "Session not found" }, 404);
  if (session.userId !== c.get("userId")) return c.json({ error: "Access denied" }, 403);

  const user = await getUserById(c.get("userId"));
  if (!user) return c.json({ error: "User not found" }, 404);

  await createMessage({ sessionId: session.id, role: "user", content });

  if (session.title === "New Chat") {
    const title = content.length > 60 ? content.substring(0, 57) + "..." : content;
    await updateChatSession(session.id, { title });
  }

  const history = await getMessagesBySession(session.id);
  const conversationHistory = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const queryEmbedding = await generateEmbedding(content);
  const [localChunks, webResults] = await Promise.all([
    searchSimilarChunks(queryEmbedding, {
      madhab: user.madhab || undefined,
      country: user.country || undefined,
      limit: 6,
    }),
    searchIslamicWeb(content, user.madhab || undefined),
  ]);

  const relevantChunks = [...localChunks, ...webResults];

  return streamSSE(c, async (stream) => {
    try {
      let fullResponse = "";

      for await (const chunk of streamChatResponse(
        content,
        conversationHistory.slice(0, -1),
        user.madhab || "hanafi",
        user.country || "SA",
        relevantChunks
      )) {
        fullResponse += chunk;
        await stream.writeSSE({ data: JSON.stringify({ text: chunk }) });
      }

      await createMessage({
        sessionId: session.id,
        role: "assistant",
        content: fullResponse,
      });

      await stream.writeSSE({ data: JSON.stringify({ done: true }) });
    } catch (error) {
      console.error("Send message error:", error);
      await stream.writeSSE({ data: JSON.stringify({ error: "Stream interrupted" }) });
    }
  });
});

export default app;
