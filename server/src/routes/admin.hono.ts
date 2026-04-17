import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { authenticate, requireAdmin, type AuthVariables } from "../middleware/auth.hono";
import {
  getReferences,
  getReferenceById,
  createReference,
  updateReference,
  deleteReference,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllUsers,
  getUserByEmail,
  createUser,
  updateUser,
  getAdminStats,
  createCountryRuling,
  getCountryRulings,
  createDocumentChunks,
  deleteChunksByReference,
} from "../storage";
import { extractAndChunk } from "../services/pdf";
import { generateEmbeddings } from "../services/embeddings";

const app = new Hono<{ Variables: AuthVariables }>();

// All admin routes require auth + admin role
app.use("*", authenticate, requireAdmin);

// ─── Stats ────────────────────────────────────────────────────────────────────

app.get("/stats", async (c) => {
  try {
    const stats = await getAdminStats();
    return c.json(stats);
  } catch (error) {
    console.error("Admin stats error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ─── Users ────────────────────────────────────────────────────────────────────

app.get("/users", async (c) => {
  try {
    const userList = await getAllUsers();
    return c.json(userList.map(({ passwordHash, ...u }) => u));
  } catch (error) {
    console.error("Admin users error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/users", async (c) => {
  try {
    const { email, password, firstName, lastName, isAdmin } = await c.req.json();
    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const existing = await getUserByEmail(email);
    if (existing) return c.json({ error: "Email already registered" }, 409);

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser({ email, passwordHash, firstName, lastName, isAdmin: !!isAdmin, onboardingComplete: true });
    const { passwordHash: _, ...userPublic } = user;
    return c.json(userPublic, 201);
  } catch (error) {
    console.error("Admin create user error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.patch("/users/:id/password", async (c) => {
  try {
    const { password } = await c.req.json();
    if (!password) return c.json({ error: "Password is required" }, 400);

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await updateUser(c.req.param("id"), { passwordHash } as any);
    const { passwordHash: _, ...userPublic } = user;
    return c.json(userPublic);
  } catch (error) {
    console.error("Admin set password error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ─── References CRUD ──────────────────────────────────────────────────────────

app.get("/references", async (c) => {
  try {
    const { madhab, country, categoryId, sourceType, search } = c.req.query();
    const refs = await getReferences({ madhab, country, categoryId, sourceType, search, activeOnly: false });
    return c.json(refs);
  } catch (error) {
    console.error("Admin references error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/references/:id", async (c) => {
  try {
    const ref = await getReferenceById(c.req.param("id"));
    if (!ref) return c.json({ error: "Reference not found" }, 404);
    return c.json(ref);
  } catch (error) {
    console.error("Admin get reference error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/references", async (c) => {
  try {
    const { title, titleAr, content, contentAr, source, sourceType, madhab, country, categoryId, tags } = await c.req.json();
    if (!title || !content || !source || !sourceType) {
      return c.json({ error: "title, content, source, and sourceType are required" }, 400);
    }

    const ref = await createReference({ title, titleAr, content, contentAr, source, sourceType, madhab, country, categoryId, tags });
    return c.json(ref, 201);
  } catch (error) {
    console.error("Admin create reference error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.put("/references/:id", async (c) => {
  try {
    const existing = await getReferenceById(c.req.param("id"));
    if (!existing) return c.json({ error: "Reference not found" }, 404);

    const ref = await updateReference(c.req.param("id"), await c.req.json());
    return c.json(ref);
  } catch (error) {
    console.error("Admin update reference error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.delete("/references/:id", async (c) => {
  try {
    const existing = await getReferenceById(c.req.param("id"));
    if (!existing) return c.json({ error: "Reference not found" }, 404);

    await deleteReference(c.req.param("id"));
    return c.body(null, 204);
  } catch (error) {
    console.error("Admin delete reference error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ─── PDF Upload (RAG) ─────────────────────────────────────────────────────────

app.post("/references/upload-pdf", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return c.json({ error: "PDF file is required" }, 400);

    const title = formData.get("title") as string;
    const source = formData.get("source") as string;
    const sourceType = formData.get("sourceType") as string;
    const madhab = formData.get("madhab") as string | null;
    const country = formData.get("country") as string | null;
    const tagsRaw = formData.get("tags") as string | null;

    if (!title || !source || !sourceType) {
      return c.json({ error: "title, source, and sourceType are required" }, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const chunks = await extractAndChunk(buffer);

    if (chunks.length === 0) {
      return c.json({ error: "No text could be extracted from the PDF" }, 400);
    }

    const embeddings = await generateEmbeddings(chunks.map((ch) => ch.content));
    const parsedTags = tagsRaw ? JSON.parse(tagsRaw) : null;

    const ref = await createReference({
      title,
      content: `PDF document with ${chunks.length} chunks`,
      source,
      sourceType,
      madhab: madhab || null,
      country: country || null,
      tags: parsedTags,
    });

    await createDocumentChunks(
      chunks.map((chunk, i) => ({
        referenceId: ref.id,
        content: chunk.content,
        embedding: embeddings[i],
        chunkIndex: i,
        pageNumber: chunk.pageNumber,
      }))
    );

    return c.json({ ...ref, chunksCount: chunks.length }, 201);
  } catch (error) {
    console.error("PDF upload error:", error);
    return c.json({ error: "Failed to process PDF" }, 500);
  }
});

// ─── Categories CRUD ──────────────────────────────────────────────────────────

app.get("/categories", async (c) => {
  try {
    return c.json(await getAllCategories());
  } catch (error) {
    console.error("Admin categories error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/categories", async (c) => {
  try {
    const { name, nameAr, parentId } = await c.req.json();
    if (!name) return c.json({ error: "name is required" }, 400);

    return c.json(await createCategory({ name, nameAr, parentId }), 201);
  } catch (error) {
    console.error("Admin create category error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.put("/categories/:id", async (c) => {
  try {
    return c.json(await updateCategory(c.req.param("id"), await c.req.json()));
  } catch (error) {
    console.error("Admin update category error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.delete("/categories/:id", async (c) => {
  try {
    await deleteCategory(c.req.param("id"));
    return c.body(null, 204);
  } catch (error) {
    console.error("Admin delete category error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ─── Country Rulings ──────────────────────────────────────────────────────────

app.get("/country-rulings/:country", async (c) => {
  try {
    return c.json(await getCountryRulings(c.req.param("country")));
  } catch (error) {
    console.error("Admin country rulings error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/country-rulings", async (c) => {
  try {
    const { country, referenceId, notes } = await c.req.json();
    if (!country || !referenceId) {
      return c.json({ error: "country and referenceId are required" }, 400);
    }

    return c.json(await createCountryRuling({ country, referenceId, notes }), 201);
  } catch (error) {
    console.error("Admin create country ruling error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
