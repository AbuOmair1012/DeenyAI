# IslamAI (Ask Deeny) — Claude Code Guide

## What this app is
An Islamic Q&A assistant ("Ask Deeny" / "DeenyAI") that uses RAG (Retrieval-Augmented Generation) to answer Islamic questions based on the user's madhab and country. Users chat with an AI that references uploaded Islamic texts (PDFs), Quran, hadith, and fatwas sourced from 8 trusted Islamic websites.

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
- Use **direct connection** (not session pooler) — pooler is IPv4-only and causes failures on IPv6 networks
- Connection string in root `.env` as `DATABASE_URL`
- Password contains `@` — URL-encoded as `%40` in the connection string
- SSL is required: `{ rejectUnauthorized: false }`
- ORM: **Drizzle ORM** (`drizzle-orm/node-postgres`) with `pg.Pool`
- Schema lives in `packages/shared/src/schema.ts` — imported as `@deenyai/shared`
- Schema migrations: `npm run db:push` (drizzle-kit push, not migrate)

## Database schema (7 tables)
| Table | Purpose |
|---|---|
| `users` | Auth, madhab, country, onboardingComplete flag |
| `chat_sessions` | Per-user conversation sessions |
| `messages` | Chat history (role: user/assistant) |
| `categories` | Islamic topic categories (bilingual) |
| `references` | Islamic knowledge base (Quran, hadith, fatwa, scholarly_opinion, ijma) — table name is `references` NOT `references_` |
| `country_rulings` | Country-specific rulings linked to references |
| `document_chunks` | RAG vector store — text chunks with 256-dim embeddings |

> **Important**: Drizzle schema uses `pgTable("references", ...)` — the actual DB table is named `references`. An old bug used `references_` (with underscore) which broke joins.

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
- AI **only answers from provided sources** (web search results + RAG chunks); declines if no sources found

## Web Search
- Uses **Tavily API** in `server/src/services/websearch.ts`
- Restricted to exactly these 8 domains only:
  1. `islamweb.net`
  2. `binbaz.org.sa` — Sheikh Abd al-Aziz ibn Baz
  3. `binothaimeen.net` — Sheikh Muhammad ibn Salih al-Uthaymeen
  4. `dorar.net` — Dorar.net Islamic Encyclopedia
  5. `taimiah.org` — Sheikh Ibn Taymiyyah
  6. `ibntaymea.com` — Sheikh Ibn Taymiyyah
  7. `ibntaymiyya-academy.com`
  8. `midad.com`
- AI must include URLs in references; must decline to answer if no results from these domains
- `search_depth: "advanced"`, `max_results: 6`

## Onboarding flow
1. Language selection (`/(onboarding)/language`) — first screen, new users only
2. Country selection (`/(onboarding)/country`)
3. Madhab selection (`/(onboarding)/madhab`)
4. After completing all 3, `onboardingComplete` is set to `true` on user record
5. On subsequent logins, users go directly to `/(app)/chat` — no re-onboarding
- Settings screen allows updating country, madhab, and language post-onboarding
- Pass `?from=settings` query param to onboarding screens to trigger `router.back()` instead of redirect to chat

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
- App name: **Ask Deeny** (`com.deenyai.app`)
- Logo: `mobile/assets/AskDeenyLogo.png`
- EAS project ID: `0bfe4b5f-5bb6-47f9-bdd0-9d0c1656e1f7` (account: `abdo1012`)

## Mobile — Internationalization (i18n)
- Two languages: **English** and **Arabic**
- Translation strings in `mobile/i18n/index.ts` — `getT(lang)` returns typed translation object
- Language state managed by Zustand store in `mobile/hooks/useLanguage.ts`
  - Persists to SecureStore key `"app_language"`
  - Calls `I18nManager.forceRTL(true/false)` on language change
  - Returns `{ needsRestart }` when RTL direction changes — app must restart to apply RTL layout
- RTL layout: use `flexDirection: "row-reverse"` and `textAlign: "right"` with `isRTL` flag
- Language initialized in `mobile/app/_layout.tsx` before auth: `initLang().then(() => initialize())`

## Mobile — Color theme
- Primary color: **`#0F503A`** (Islamic green)
- Full palette in `mobile/theme/colors.ts` — always use color tokens, never hardcode hex values
- Key colors: `primary: "#0F503A"`, `userBubble: "#0F503A"`, `assistantBubble: "#EBF2EE"`, `background: "#F6F9F7"`
- Splash background: `#0F503A`

## Building the Android APK
- Local builds **fail on Windows** due to a CMake path issue with `react-native-reanimated` (drive letter `C:` mangled to `C_` in Ninja build paths)
- Use **EAS cloud build** instead:
  ```bash
  cd mobile
  npx eas-cli build --platform android --profile preview --non-interactive
  ```
- Profile `preview` → outputs `.apk` (internal distribution)
- Profile `production` → outputs `.aab` (Play Store)

## Environment variables (root `.env`)
```
DATABASE_URL=postgresql://postgres:...@db.veeivfudvzqnttgilhxn.supabase.co:5432/postgres
DEEPSEEK_API_KEY=...
JWT_SECRET=...
PORT=3005
```

## Key conventions
- TypeScript everywhere (server, admin, shared, mobile)
- Zod schemas auto-generated from Drizzle tables via `drizzle-zod`
- `bun` is the package manager for server/mobile; `npm` workspaces at root
- No migrations directory — schema changes go through `drizzle-kit push`
- Arabic support throughout (bilingual fields: `name`/`nameAr`, `title`/`titleAr`, etc.)
- Server runs on **port 3005** (not 3000)
