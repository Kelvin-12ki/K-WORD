# Deployment Guide (Vercel)

## 1. Push to GitHub

```bash
git init
git add .
git commit -m "K WORD — AI vocabulary platform"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## 2. MongoDB Atlas for Production

1. Create an Atlas cluster (M0 free tier is fine to start).
2. **Database Access** → create a dedicated user (not your dev user).
3. **Network Access** → add `0.0.0.0/0` (Vercel IPs are dynamic), or use Vercel's
   [Managed MongoDB integration](https://vercel.com/marketplace).
4. Copy the connection string — you'll paste it in Vercel.

## 3. Deploy to Vercel

1. [vercel.com/new](https://vercel.com/new) → import your repo.
2. Framework preset: **Next.js** (auto-detected).
3. **Environment Variables** → add:

| Name | Value |
|---|---|
| `MONGODB_URI` | Atlas connection string (production DB) |
| `AUTH_SECRET` | New random secret (do NOT reuse dev) |
| `AUTH_URL` | `https://your-app.vercel.app` |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` (compat) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret |
| `OPENAI_API_KEY` | OpenAI key (server-side only) |
| `OPENAI_MODEL` | `gpt-4o-mini` (optional) |

4. **Deploy**.

## 4. Google OAuth for Production

In Google Cloud Console, add to the same OAuth client:

- Authorized redirect URI: `https://your-app.vercel.app/api/auth/callback/google`

## 5. Seed Production (optional)

Run locally against the production URI:

```bash
MONGODB_URI="<prod-uri>" AUTH_SECRET="<prod-secret>" npm run seed
```

Or create the first account through the UI instead.

## 6. Post-deploy Checklist

- [ ] Sign up with email works
- [ ] Google login works
- [ ] Add a word → AI enrichment returns examples
- [ ] Dashboard charts render
- [ ] Review session completes
- [ ] `GET /api/extension/save` returns the API doc JSON
- [ ] Dark/light toggle persists

## Alternative Hosts

K WORD is a standard Next.js app — any Node host works:

| Host | Notes |
|---|---|
| **Vercel** | Recommended; edge middleware supported |
| **Railway / Render** | `npm run build && npm start`, set all env vars |
| **Self-hosted** | `npm run build && npm start` behind Nginx/Caddy |

## Production Hardening

- Enable Atlas **backup snapshots** and set a retention policy.
- Set `OPENAI_API_KEY` as a Vercel environment variable only (never committed).
- Add rate limiting (e.g. Upstash Ratelimit) in `middleware.ts` for `/api/*`.
- Configure error monitoring (Sentry `@sentry/nextjs`).
- Set `AUTH_SECRET` to ≥ 32 random bytes.
