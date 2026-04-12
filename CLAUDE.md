# IslamAI (DeenyAI) — Claude Code Guide

## What this app is
An Islamic Q&A assistant ("DeenyAI") that uses RAG (Retrieval-Augmented Generation) to answer Islamic questions based on the user's madhab and country. Users chat with an AI that references uploaded Islamic texts (PDFs), Quran, hadith, and fatwas.

## Monorepo structure
```
IslamAI/
├── server/          # Express + TypeScript API (bun)
├── admin/           # React admin dashboard (Vite)
├── packages/shared/ # Drizzle schema + shared types (consumed by server & admin)
├── mobile/          # React Native / Expo mobile app (standalone — NOT in npm workspaces)
└── drizzle.config.ts
```

- `server`, `admin`, `packages/*` are npm workspaces managed from root
- `mobile/` is **not** a workspace — run its commands from inside `mobile/`

## Running the project
```bash
# Server (from root)
npm run dev:server        # or: cd server && bun run dev

# Admin dashboard (from root)
npm run dev:admin

# Mobile (from mobile/)
cd mobile && bun expo start

# DB schema push
npm run db:push           # uses drizzle.config.ts at root
```

## Database
- **Supabase PostgreSQL** hosted at `db.veeivfudvzqnttgilhxn.supabase.co:5432`
- Connection string in root `.env` as `DATABASE_URL`
- Password contains `@` — URL-encoded as `%40` in the connection string
- SSL is required: `{ rejectUnauthorized: false }`
- ORM: **Drizzle ORM** (`drizzle-orm/node-postgres`) with `pg.Pool`
- Schema lives in `packages/shared/src/schema.ts` — imported as `@deenyai/shared`
- Schema migrations: `npm run db:push` (drizzle-kit push, not migrate)

## Database schema (7 tables)
| Table | Purpose |
|---|---|
| `users` | Auth, madhab, country, onboarding state |
| `chat_sessions` | Per-user conversation sessions |
| `messages` | Chat history (role: user/assistant) |
| `categories` | Islamic topic categories (bilingual) |
| `references_` | Islamic knowledge base (Quran, hadith, fatwa, scholarly_opinion, ijma) |
| `country_rulings` | Country-specific rulings linked to references |
| `document_chunks` | RAG vector store — text chunks with 256-dim embeddings |

## RAG / Embeddings
- Custom **hash-based embeddings** (256-dim, no external API) in `server/src/services/embeddings.ts`
- Vector similarity: custom cosine similarity SQL in `server/src/storage.ts` (`searchSimilarChunks`)
- Embeddings stored as JSONB arrays in `document_chunks.embedding`
- PDF upload → extract text → chunk → embed → store in `document_chunks`
- At chat time: embed user query → cosine search → inject top-8 chunks as context

## AI / Chat
- Uses **DeepSeek API** (`DEEPSEEK_API_KEY` in `.env`) via `server/src/services/claude.ts`
- Streaming responses via SSE (`text/event-stream`)
- System prompt is madhab + country aware
- Chat route: `POST /api/chat/sessions/:id/messages`

## API routes
- `POST /api/auth/register` — register
- `POST /api/auth/login` — login → JWT
- `GET  /api/auth/me` — current user
- `PATCH /api/auth/me` — update profile / complete onboarding
- `POST /api/chat/sessions` — create session
- `GET  /api/chat/sessions` — list sessions
- `GET  /api/chat/sessions/:id` — get session with messages
- `DELETE /api/chat/sessions/:id` — delete session
- `POST /api/chat/sessions/:id/messages` — send message (SSE)
- `/api/admin/*` — admin routes

## Mobile app
- **Expo 52** + **React Native 0.76** (old architecture — `newArchEnabled: false`)
- File-based routing via `expo-router`
- Auth tokens stored in `expo-secure-store`
- API client: `mobile/services/api.ts`
- **API_URL is hardcoded to local Wi-Fi IP** — must match your machine's current IP
  - Check current IP: `ipconfig` → Wi-Fi IPv4
  - Update `API_URL` in `mobile/services/api.ts` when IP changes
- Android package: `com.deenyai.app`
- EAS project ID: `0bfe4b5f-5bb6-47f9-bdd0-9d0c1656e1f7` (account: `abdo1012`)

## Building the Android APK
- Local builds **fail on Windows** due to a CMake path issue with `react-native-reanimated` (drive letter `C:` mangled to `C_` in Ninja build paths)
- Use **EAS cloud build** instead:
  ```bash
  cd mobile
  npx eas-cli build --platform android --profile preview --non-interactive
  ```
- Profile `preview` → outputs `.apk` (internal distribution)
- Profile `production` → outputs `.aab` (Play Store)
- Splash screen asset: `mobile/assets/splash.png` (teal #0D7377)

## Environment variables (root `.env`)
```
DATABASE_URL=postgresql://postgres:...@db.veeivfudvzqnttgilhxn.supabase.co:5432/postgres
DEEPSEEK_API_KEY=...
JWT_SECRET=...
PORT=3000
```

## Key conventions
- TypeScript everywhere (server, admin, shared, mobile)
- Zod schemas auto-generated from Drizzle tables via `drizzle-zod`
- `bun` is the package manager for server/mobile; `npm` workspaces at root
- No migrations directory — schema changes go through `drizzle-kit push`
- Arabic support throughout (bilingual fields: `name`/`nameAr`, `title`/`titleAr`, etc.)
