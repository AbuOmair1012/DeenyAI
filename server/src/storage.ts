import { eq, desc, and, or, ilike, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  chatSessions,
  messages,
  categories,
  references,
  countryRulings,
  documentChunks,
} from "@deenyai/shared";
import type {
  User,
  InsertUser,
  ChatSession,
  InsertChatSession,
  Message,
  InsertMessage,
  Category,
  InsertCategory,
  Reference,
  InsertReference,
  CountryRuling,
  InsertCountryRuling,
  InsertDocumentChunk,
  AdminStats,
} from "@deenyai/shared";

// ─── Users ───────────────────────────────────────────────────────────────────

export async function createUser(data: InsertUser): Promise<User> {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function getUserByEmail(
  email: string
): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

export async function updateUser(
  id: string,
  data: Partial<InsertUser>
): Promise<User> {
  const [user] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return user;
}

export async function getAllUsers(): Promise<User[]> {
  return db.select().from(users).orderBy(desc(users.createdAt));
}

// ─── Chat Sessions ──────────────────────────────────────────────────────────

export async function createChatSession(
  data: InsertChatSession
): Promise<ChatSession> {
  const [session] = await db.insert(chatSessions).values(data).returning();
  return session;
}

export async function getChatSessionsByUser(
  userId: string
): Promise<ChatSession[]> {
  return db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.userId, userId))
    .orderBy(desc(chatSessions.updatedAt));
}

export async function getChatSessionById(
  id: string
): Promise<ChatSession | undefined> {
  const [session] = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.id, id));
  return session;
}

export async function updateChatSession(
  id: string,
  data: Partial<InsertChatSession>
): Promise<ChatSession> {
  const [session] = await db
    .update(chatSessions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(chatSessions.id, id))
    .returning();
  return session;
}

export async function deleteChatSession(id: string): Promise<void> {
  await db.delete(chatSessions).where(eq(chatSessions.id, id));
}

// ─── Messages ────────────────────────────────────────────────────────────────

export async function createMessage(data: InsertMessage): Promise<Message> {
  const [message] = await db.insert(messages).values(data).returning();
  // Update session timestamp
  await db
    .update(chatSessions)
    .set({ updatedAt: new Date() })
    .where(eq(chatSessions.id, data.sessionId));
  return message;
}

export async function getMessagesBySession(
  sessionId: string
): Promise<Message[]> {
  return db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
    .orderBy(messages.createdAt);
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function createCategory(
  data: InsertCategory
): Promise<Category> {
  const [category] = await db.insert(categories).values(data).returning();
  return category;
}

export async function getAllCategories(): Promise<Category[]> {
  return db.select().from(categories).orderBy(categories.name);
}

export async function updateCategory(
  id: string,
  data: Partial<InsertCategory>
): Promise<Category> {
  const [category] = await db
    .update(categories)
    .set(data)
    .where(eq(categories.id, id))
    .returning();
  return category;
}

export async function deleteCategory(id: string): Promise<void> {
  await db.delete(categories).where(eq(categories.id, id));
}

// ─── References ──────────────────────────────────────────────────────────────

export async function createReference(
  data: InsertReference
): Promise<Reference> {
  const [ref] = await db.insert(references).values(data).returning();
  return ref;
}

export async function getReferenceById(
  id: string
): Promise<Reference | undefined> {
  const [ref] = await db
    .select()
    .from(references)
    .where(eq(references.id, id));
  return ref;
}

export async function getReferences(filters?: {
  madhab?: string;
  country?: string;
  categoryId?: string;
  sourceType?: string;
  search?: string;
  activeOnly?: boolean;
}): Promise<Reference[]> {
  const conditions = [];

  if (filters?.madhab) {
    conditions.push(
      or(eq(references.madhab, filters.madhab), sql`${references.madhab} IS NULL`)
    );
  }
  if (filters?.country) {
    conditions.push(
      or(eq(references.country, filters.country), sql`${references.country} IS NULL`)
    );
  }
  if (filters?.categoryId) {
    conditions.push(eq(references.categoryId, filters.categoryId));
  }
  if (filters?.sourceType) {
    conditions.push(eq(references.sourceType, filters.sourceType));
  }
  if (filters?.search) {
    conditions.push(
      or(
        ilike(references.title, `%${filters.search}%`),
        ilike(references.content, `%${filters.search}%`)
      )
    );
  }
  if (filters?.activeOnly !== false) {
    conditions.push(eq(references.isActive, true));
  }

  const query = conditions.length
    ? db
        .select()
        .from(references)
        .where(and(...conditions))
        .orderBy(desc(references.updatedAt))
    : db.select().from(references).orderBy(desc(references.updatedAt));

  return query;
}

export async function updateReference(
  id: string,
  data: Partial<InsertReference>
): Promise<Reference> {
  const [ref] = await db
    .update(references)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(references.id, id))
    .returning();
  return ref;
}

export async function deleteReference(id: string): Promise<void> {
  await db
    .update(references)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(references.id, id));
}

// ─── Country Rulings ─────────────────────────────────────────────────────────

export async function createCountryRuling(
  data: InsertCountryRuling
): Promise<CountryRuling> {
  const [ruling] = await db.insert(countryRulings).values(data).returning();
  return ruling;
}

export async function getCountryRulings(
  country: string
): Promise<CountryRuling[]> {
  return db
    .select()
    .from(countryRulings)
    .where(eq(countryRulings.country, country));
}

// ─── Admin Stats ─────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [userCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users);
  const [sessionCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(chatSessions);
  const [messageCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(messages);
  const [activeCount] = await db
    .select({ count: sql<number>`count(distinct ${chatSessions.userId})::int` })
    .from(chatSessions)
    .where(sql`${chatSessions.updatedAt} >= ${today}`);

  return {
    totalUsers: userCount.count,
    totalSessions: sessionCount.count,
    totalMessages: messageCount.count,
    activeUsersToday: activeCount.count,
  };
}

// ─── Document Chunks (RAG) ────────────────────────────────────────────────

export async function createDocumentChunks(
  chunks: InsertDocumentChunk[]
): Promise<void> {
  // Bulk insert in batches of 50
  for (let i = 0; i < chunks.length; i += 50) {
    const batch = chunks.slice(i, i + 50);
    await db.insert(documentChunks).values(batch);
  }
}

export async function deleteChunksByReference(
  referenceId: string
): Promise<void> {
  await db
    .delete(documentChunks)
    .where(eq(documentChunks.referenceId, referenceId));
}

export async function searchSimilarChunks(
  embedding: number[],
  opts: {
    madhab?: string;
    country?: string;
    limit?: number;
  } = {}
): Promise<{ content: string; source: string; title: string; similarity: number }[]> {
  const limit = opts.limit || 8;
  const embeddingJson = JSON.stringify(embedding);

  // Cosine similarity via raw SQL on jsonb arrays
  const cosineSim = sql<number>`(
    SELECT COALESCE(
      SUM(a * b) / NULLIF(
        SQRT(SUM(a * a)) * SQRT(SUM(b * b)),
        0
      ),
      0
    )
    FROM unnest(
      ARRAY(SELECT jsonb_array_elements_text(${documentChunks.embedding})::float8),
      ARRAY(SELECT jsonb_array_elements_text(${embeddingJson}::jsonb)::float8)
    ) AS t(a, b)
  )`;

  const conditions = [eq(references.isActive, true)];

  if (opts.madhab) {
    conditions.push(
      or(eq(references.madhab, opts.madhab), sql`${references.madhab} IS NULL`)!
    );
  }
  if (opts.country) {
    conditions.push(
      or(eq(references.country, opts.country), sql`${references.country} IS NULL`)!
    );
  }

  const results = await db
    .select({
      content: documentChunks.content,
      source: references.source,
      title: references.title,
      similarity: cosineSim,
    })
    .from(documentChunks)
    .innerJoin(references, eq(documentChunks.referenceId, references.id))
    .where(and(...conditions))
    .orderBy(sql`${cosineSim} DESC`)
    .limit(limit);

  return results;
}
