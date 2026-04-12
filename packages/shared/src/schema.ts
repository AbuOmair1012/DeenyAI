import {
  pgTable,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  country: varchar("country", { length: 2 }),
  madhab: varchar("madhab", { length: 20 }),
  isAdmin: boolean("is_admin").default(false).notNull(),
  onboardingComplete: boolean("onboarding_complete").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

// ─── Chat Sessions ──────────────────────────────────────────────────────────

export const chatSessions = pgTable("chat_sessions", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertChatSessionSchema = createInsertSchema(chatSessions);
export const selectChatSessionSchema = createSelectSchema(chatSessions);

// ─── Messages ────────────────────────────────────────────────────────────────

export const messages = pgTable("messages", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id", { length: 36 })
    .notNull()
    .references(() => chatSessions.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 10 }).notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  references: jsonb("references").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages);
export const selectMessageSchema = createSelectSchema(messages);

// ─── Categories ──────────────────────────────────────────────────────────────

export const categories = pgTable("categories", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  nameAr: varchar("name_ar", { length: 100 }),
  parentId: varchar("parent_id", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCategorySchema = createInsertSchema(categories);
export const selectCategorySchema = createSelectSchema(categories);

// ─── References (Islamic Knowledge Base) ─────────────────────────────────────

export const references = pgTable("references", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 500 }).notNull(),
  titleAr: varchar("title_ar", { length: 500 }),
  content: text("content").notNull(),
  contentAr: text("content_ar"),
  source: varchar("source", { length: 255 }).notNull(),
  sourceType: varchar("source_type", { length: 30 }).notNull(), // quran, hadith, fatwa, scholarly_opinion, ijma
  madhab: varchar("madhab", { length: 20 }), // null = applies to all
  country: varchar("country", { length: 2 }), // null = universal
  categoryId: varchar("category_id", { length: 36 }).references(
    () => categories.id
  ),
  author: varchar("author", { length: 255 }),
  tags: jsonb("tags").$type<string[]>(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertReferenceSchema = createInsertSchema(references);
export const selectReferenceSchema = createSelectSchema(references);

// ─── Country Rulings ─────────────────────────────────────────────────────────

export const countryRulings = pgTable("country_rulings", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  country: varchar("country", { length: 2 }).notNull(),
  referenceId: varchar("reference_id", { length: 36 })
    .notNull()
    .references(() => references.id, { onDelete: "cascade" }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCountryRulingSchema = createInsertSchema(countryRulings);
export const selectCountryRulingSchema = createSelectSchema(countryRulings);

// ─── Document Chunks (RAG Vector Store) ─────────────────────────────────────

export const documentChunks = pgTable("document_chunks", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  referenceId: varchar("reference_id", { length: 36 })
    .notNull()
    .references(() => references.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  embedding: jsonb("embedding").$type<number[]>(),
  chunkIndex: integer("chunk_index").notNull(),
  pageNumber: integer("page_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDocumentChunkSchema = createInsertSchema(documentChunks);
export const selectDocumentChunkSchema = createSelectSchema(documentChunks);
