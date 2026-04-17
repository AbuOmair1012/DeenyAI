# Ask Deeny — Islamic Q&A Assistant

An AI-powered Islamic Q&A app that answers your questions based on your madhab and country, sourced from trusted Islamic scholars and websites.

---

## Features

- **AI-Powered Answers** — Streaming responses using DeepSeek AI with RAG (Retrieval-Augmented Generation)
- **Madhab-Aware** — Answers personalized to your school of thought (Hanafi, Maliki, Shafi'i, Hanbali)
- **Country-Specific Rulings** — Fatwas filtered by your country
- **Trusted Sources Only** — Answers sourced exclusively from:
  - Ibn Baz (`binbaz.org.sa`)
  - Ibn Uthaymeen (`binothaimeen.net`)
  - Dorar (`dorar.net`)
  - Ibn Taymiyyah (`taimiah.org`)
  - Islamweb (`islamweb.net`)
  - Midad (`midad.com`)
- **Arabic & English** — Full bilingual support with RTL layout
- **Chat History** — Sessions saved per user
- **Secure Auth** — JWT-based authentication

---

## Tech Stack

### Mobile
- React Native 0.76 + Expo 52
- Expo Router (file-based navigation)
- Zustand (state management)
- Expo Secure Store (token storage)

### Server
- Express + TypeScript (local dev)
- Hono (Cloudflare Workers deployment)
- Cloudflare Workers + Hyperdrive
- DeepSeek API (AI responses)
- Tavily API (web search)

### Database
- Supabase PostgreSQL
- Drizzle ORM
- Custom hash-based embeddings (256-dim, no external API)
- RAG vector search via cosine similarity

---

## Project Structure

```
IslamAI/
├── server/          # Express + Hono API (TypeScript)
├── admin/           # React admin dashboard (Vite)
├── packages/shared/ # Drizzle schema + shared types
├── mobile/          # React Native / Expo app
└── drizzle.config.ts
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Bun
- Supabase project
- DeepSeek API key
- Tavily API key

### 1. Clone the repo

```bash
git clone https://github.com/AbuOmair1012/IslamAI.git
cd IslamAI
```

### 2. Set up environment variables

Create a `.env` file in the root:

```env
DATABASE_URL=postgresql://postgres:<password>@db.<project>.supabase.co:5432/postgres
DEEPSEEK_API_KEY=your_key_here
JWT_SECRET=your_secret_here
TAVILY_API_KEY=your_key_here
PORT=3005
```

### 3. Push the database schema

```bash
npm run db:push
```

### 4. Run the server

```bash
npm run dev:server
```

### 5. Run the mobile app

```bash
cd mobile
bun expo start
```

> Update `API_URL` in `mobile/services/api.ts` to your machine's local Wi-Fi IP.

---

## Deployment

### Server — Cloudflare Workers

```bash
cd server
wrangler secret put DEEPSEEK_API_KEY
wrangler secret put JWT_SECRET
wrangler secret put TAVILY_API_KEY
wrangler deploy
```

### Mobile — Android APK (EAS Build)

```bash
cd mobile
npx eas-cli build --platform android --profile preview --non-interactive
```

> Local Android builds are not supported on Windows due to a CMake path issue with `react-native-reanimated`. Use EAS cloud build instead.

---

## Admin Dashboard

The admin dashboard (`/admin`) allows you to:
- Manage Islamic references and knowledge base
- Upload PDF documents for RAG indexing
- Manage users, categories, and country rulings
- View usage statistics

---

## License

This project is for educational and religious benefit. All Islamic content is sourced from trusted scholars and websites.
