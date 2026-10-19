# Installation Guide

Get K WORD running locally in under 10 minutes.

## Prerequisites

| Tool | Version | Check |
|---|---|---|
| Node.js | ≥ 18.18 (20+ recommended) | `node -v` |
| npm | ≥ 9 | `npm -v` |
| MongoDB Atlas account | Free tier works | [cloud.mongodb.com](https://cloud.mongodb.com) |

## 1. Clone & Install

```bash
git clone <your-repo-url> k-word
cd k-word
npm install
```

## 2. Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Required
MONGODB_URI="mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/kword?retryWrites=true&w=majority"
AUTH_SECRET="<openssl rand -base64 32>"

# Optional — Google login
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Optional — AI features (app degrades gracefully without it)
# Any OpenAI-compatible endpoint works — Gemini, Groq, or OpenAI itself.
AI_API_KEY=""
AI_BASE_URL="https://generativelanguage.googleapis.com/v1beta/openai/"
AI_MODEL="gemini-2.5-flash"
```

Generate `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### MongoDB Atlas setup

1. Create a free M0 cluster at [cloud.mongodb.com](https://cloud.mongodb.com).
2. **Database Access** → add a user with *Read and write to any database*.
3. **Network Access** → add IP `0.0.0.0/0` (or your dev IP).
4. **Connect → Drivers** → copy the connection string and replace `USER`/`PASS`,
   append the DB name: `...mongodb.net/kword`.

### Google Login setup (optional)

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** (Web application).
3. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID + Secret into `.env.local`.

## 3. Seed Demo Data (recommended)

```bash
npm run seed
```

Creates:

- Demo user: `demo@kword.app` / `Password123!` (override with `SEED_PASSWORD`)
- 10 realistic words across Technology, Cybersecurity, Business, Legal, Academic…
- Review history, favorites, personal examples, streak & XP

## 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 5. Verify

```bash
npm run typecheck   # no errors
npm run lint        # no errors
npm run build       # production build passes
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Missing MONGODB_URI` | You edited `.env.example` instead of `.env.local` |
| `Invalid login credentials` | Seed didn't run, or `SEED_PASSWORD` changed — rerun `npm run seed` |
| Google button errors | Redirect URI must be exactly `http://localhost:3000/api/auth/callback/google` |
| AI features show "offline mode" | `AI_API_KEY` missing — features fall back to heuristic responses |
| Port 3000 busy | `npm run dev -- -p 3001` |
| Stale build cache | Delete `.next` and rerun `npm run dev` |
