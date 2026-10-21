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
| `AI_API_KEY` | AI provider key (server-side only) |
| `AI_BASE_URL` | e.g. `https://generativelanguage.googleapis.com/v1beta/openai/` for Gemini |
| `AI_MODEL` | e.g. `gemini-2.5-flash` |

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

## 7. Practice Reminders (Web Push)

Reminders fire **6×/day at 9:10, 11:10, 13:10, 15:10, 17:10, 20:10 (GMT+3)**.

Vercel Hobby can only schedule a cron **once per day**, so the extra 5 runs come from a GitHub
Actions workflow in `.github/workflows/reminders.yml` that simply calls the same endpoint.

Setup:

1. Generate VAPID keys — `npx web-push generate-vapid-keys`
2. Set on Vercel: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET`
3. Mirror the secret to GitHub — `gh secret set CRON_SECRET --repo OWNER/REPO`
4. Set the repo variable — `gh variable set APP_URL --body "https://your-app.vercel.app" --repo OWNER/REPO`
5. Each user opts in from **Settings → Practice Reminders** (requires HTTPS + a supported browser)

Send endpoint: `GET /api/cron/notify` (auth: `Authorization: Bearer $CRON_SECRET`).
It is idempotent — a 90-minute minimum gap between sends per device prevents double nags.
Subscriptions that return 404/410 are deleted automatically.

Verify with `gh workflow run reminders.yml --ref main`, then check `gh run list`.

## Alternative Hosts

K WORD is a standard Next.js app — any Node host works:

| Host | Notes |
|---|---|
| **Vercel** | Recommended; edge middleware supported |
| **Railway / Render** | `npm run build && npm start`, set all env vars |
| **Self-hosted** | `npm run build && npm start` behind Nginx/Caddy |

## Production Hardening

- Enable Atlas **backup snapshots** and set a retention policy.
- Set `AI_API_KEY` as a Vercel environment variable only (never committed).
- Add rate limiting (e.g. Upstash Ratelimit) in `middleware.ts` for `/api/*`.
- Configure error monitoring (Sentry `@sentry/nextjs`).
- Set `AUTH_SECRET` to ≥ 32 random bytes.
