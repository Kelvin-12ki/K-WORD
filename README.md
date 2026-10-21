# K WORD

**AI Vocabulary Bank & Language Mastery Platform** — your personal language second brain.

K WORD transforms words from passive recognition into natural active usage through AI-powered
enrichment, spaced-repetition review, sentence practice, realistic conversation and writing
analysis.

![Next.js](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4-indigo) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)

---

## Features

| Area | What you get |
|---|---|
| **Auth** | Email/password + Google sign-in (Microsoft-ready), JWT sessions |
| **Dashboard** | Total/mastered/favorites/streak/due stats, growth, activity, mastery & category charts |
| **Add Word** | Create words with optional AI enrichment preview before saving |
| **AI Enrichment** | Definition, pronunciation, synonyms, antonyms, POS + 4 contextual examples (Professional/Business/Academic/Daily) |
| **Daily Review** | Flashcard flow: word → recall → reveal → rate Easy/Medium/Hard with SM-2-style intervals (1/3/7/14/30/60 days) |
| **Sentence Practice** | AI scores grammar, naturalness, context (0–10) with feedback and a suggested rewrite |
| **My Examples** | Personal sentences stored forever |
| **Today's Word** | Daily random word + "use it 3× today" challenge with history |
| **Journal** | Social-feed timeline grouped by Today / Yesterday / This Week / … |
| **Categories** | 9 defaults + unlimited custom categories |
| **Favorites** | Star words into a dedicated section |
| **Search** | Instant search across word, meaning, category, synonyms, notes, learned-from |
| **Word Playground** | AI conversation in Cybersecurity/Technology/Entrepreneurship/Business/Education that weaves in your saved vocabulary |
| **Writing Assistant** | Vocabulary diversity, repetition and strength scores + stronger-word suggestions from your bank |
| **Gamification** | XP + 5 levels (Word Collector → Wordsmith), daily streaks |
| **Extension API** | Ready-to-use `/api/extension/save` with per-user API keys |
| **Practice Reminders** | Web push notifications 6×/day: words due for review, streak nudges, practice prompts |
| **Theme** | Indigo/Slate/Emerald palette, dark + light mode, mobile-first responsive |

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS 4, ShadCN-style UI
- **Backend:** Next.js Route Handlers
- **Database:** MongoDB Atlas + Mongoose ODM
- **Auth:** NextAuth / Auth.js v5 (Credentials + Google)
- **AI:** Any OpenAI-compatible API — Gemini, Groq or OpenAI (graceful offline fallbacks when no key is set)
- **Charts:** Recharts
- **Deploy:** Vercel

## Quick Start

```bash
git clone <your-repo-url> k-word && cd k-word
npm install
cp .env.example .env.local     # fill in MONGODB_URI, AUTH_SECRET, AI_API_KEY
npm run seed                   # optional demo data
npm run dev                    # http://localhost:3000
```

Full instructions: **[docs/INSTALLATION.md](docs/INSTALLATION.md)**
Deployment: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**
Architecture: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**

## Demo Account

After `npm run seed`:

```
Email:    demo@kword.app
Password: Password123!   (override with SEED_PASSWORD)
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npm run seed` | Seed demo user + vocabulary |

## Project Structure

```
k-word/
├── scripts/seed.ts                 # Demo data seeder
├── src/
│   ├── app/
│   │   ├── (auth)/                 # login, register
│   │   ├── (app)/                  # authed app shell
│   │   │   ├── dashboard/  words/  review/  practice/
│   │   │   ├── playground/ writing/ journal/ favorites/ settings/
│   │   └── api/                    # 22 route handlers
│   │       ├── auth/  words/  reviews/  challenges/
│   │       ├── journal/  categories/  search/  stats/  me/
│   │       ├── ai/{enrich,evaluate,conversation,analyze}/
│   │       └── extension/{save,key}/
│   ├── components/                 # ui/, layout/, dashboard/, words/, practice/
│   ├── lib/                        # db, auth, ai, srs, gamification, validators
│   ├── models/                     # Mongoose schemas
│   └── types/
└── docs/
```

## Environment Variables

See [.env.example](.env.example).

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection |
| `AUTH_SECRET` | ✅ | NextAuth JWT signing |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional | Google login |
| `AI_API_KEY` | Optional* | AI features (*app runs in offline-fallback mode without it) |
| `AI_BASE_URL` | Optional | OpenAI-compatible endpoint, e.g. Gemini or Groq |
| `AI_MODEL` | Optional | Defaults to `gpt-4o-mini`; set `gemini-2.5-flash` for Gemini |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Optional | Web push reminders (`npx web-push generate-vapid-keys`) |
| `CRON_SECRET` | Optional | Bearer token guarding `/api/cron/notify` (mirror it in GitHub Actions) |

## API Overview

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| * | `/api/auth/[...nextauth]` | NextAuth handlers |
| GET/POST | `/api/words` | List/search & create words |
| GET/PATCH/DELETE | `/api/words/:id` | Read/update/delete a word |
| POST | `/api/words/:id/favorite` | Toggle favorite |
| GET/POST | `/api/words/:id/examples` | Personal examples |
| GET/POST | `/api/words/:id/practice` | Attempt history & AI evaluation |
| GET/POST | `/api/reviews` | Due words & submit rating |
| GET/POST | `/api/challenges/today` | Daily word & completion |
| GET | `/api/journal` | Timeline groups |
| GET/POST | `/api/categories` | Categories |
| GET | `/api/search?q=` | Instant search |
| GET | `/api/stats` | Dashboard aggregates |
| GET | `/api/me` | Current profile |
| POST | `/api/ai/enrich` | Preview enrichment |
| POST | `/api/ai/evaluate` | Evaluate sentence |
| POST | `/api/ai/conversation` | Playground start/continue |
| POST | `/api/ai/analyze` | Writing analysis |
| POST | `/api/extension/save` | **Public** — save word via `X-API-Key` |
| GET/POST | `/api/extension/key` | Manage extension API key |

## Future Roadmap (architecture-ready)

- **Browser extension** — endpoints already live
- **Mobile app** — reuse `/api/*` as-is
- **Voice pronunciation** — Web Speech API already used for playback
- **Kindle import** — add `/api/import/kindle`
- **AI speaking coach / debate mode** — extend `/api/ai/*`
- **Community vocabulary sharing** — add public `Share` flag on Word

## License

MIT
