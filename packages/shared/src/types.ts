import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type {
  users,
  chatSessions,
  messages,
  categories,
  references,
  countryRulings,
} from "./schema";

// Select types (reading from DB)
export type User = InferSelectModel<typeof users>;
export type ChatSession = InferSelectModel<typeof chatSessions>;
export type Message = InferSelectModel<typeof messages>;
export type Category = InferSelectModel<typeof categories>;
export type Reference = InferSelectModel<typeof references>;
export type CountryRuling = InferSelectModel<typeof countryRulings>;

// Insert types (writing to DB)
export type InsertUser = InferInsertModel<typeof users>;
export type InsertChatSession = InferInsertModel<typeof chatSessions>;
export type InsertMessage = InferInsertModel<typeof messages>;
export type InsertCategory = InferInsertModel<typeof categories>;
export type InsertReference = InferInsertModel<typeof references>;
export type InsertCountryRuling = InferInsertModel<typeof countryRulings>;

// API response types
export type UserPublic = Omit<User, "passwordHash">;

export type ChatSessionWithMessages = ChatSession & {
  messages: Message[];
};

export type AuthResponse = {
  token: string;
  user: UserPublic;
};

export type AdminStats = {
  totalUsers: number;
  totalSessions: number;
  totalMessages: number;
  activeUsersToday: number;
};
