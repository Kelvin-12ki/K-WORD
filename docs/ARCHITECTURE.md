# Architecture

K WORD follows clean, layered architecture. Every request flows through the same pipeline:

```
UI (client component)
  → Route Handler (validation + orchestration)
    → Session guard (requireUser)
      → Service layer (AI / SRS / gamification)
        → Mongoose model
          → MongoDB
```

## Layer Responsibilities

### 1. Presentation — `src/app`, `src/components`

- **Route groups:** `(auth)` for public pages, `(app)` for the authenticated shell.
- The `(app)/layout.tsx` resolves the user once and feeds the sidebar (level, XP, streak).
- Components are split into `ui/` (ShadCN primitives) and feature folders
  (`dashboard/`, `words/`, `practice/`, `layout/`).
- Server components fetch; client components own interaction + toasts.

### 2. API — `src/app/api/*`

Each handler follows the same shape:

```ts
export async function POST(req: Request) {
  try {
    const { userId } = await requireUser();   // auth guard → ApiError(401)
    const parsed = schema.safeParse(body);    // zod validation → 400
    // ...orchestrate services...
    return Response.json(dto, { status: 201 });
  } catch (err) {
    return handleApiError(err);               // uniform error envelope
  }
}
```

Errors always return `{ error: string }` with an appropriate status.

### 3. Domain services — `src/lib`

| Module | Responsibility |
|---|---|
| `db.ts` | Cached Mongoose singleton (hot-reload safe, pool size 10) |
| `auth.ts` + `auth.config.ts` | Auth.js config. **Config is split** so `middleware.ts` stays Edge-safe (no Mongoose). |
| `session.ts` | `requireUser()` guard + `handleApiError()` |
| `ai/client.ts` | OpenAI client factory, `aiAvailable()` gate, JSON-mode helper |
| `ai/service.ts` | `enrichWord`, `evaluateSentence`, `generateConversation`, `continueConversation`, `analyzeWriting` — each with deterministic fallbacks so the app works without an API key |
| `spaced-repetition.ts` | Interval ladder + `scheduleReview(level, rating, count)` |
| `gamification.ts` | XP→level mapping, level progress, streak calculation |
| `activity.ts` | `awardXP()` — atomic XP + streak refresh in one update |
| `stats.ts` | Dashboard aggregates (single-match `$group` pipeline) |
| `serializers.ts` | Mongoose doc → JSON DTO (keeps `_id`/`ObjectId` out of the client) |
| `validators.ts` | Zod schemas shared by route handlers |

### 4. Data — `src/models`

| Model | Key indexes | Notes |
|---|---|---|
| `User` | `email` unique, `extensionApiKey` sparse-unique | `passwordHash` and `extensionApiKey` are `select: false` |
| `Word` | `(userId, word)` unique, `(userId, category)`, `(userId, favorite)`, `(userId, nextReviewDate)`, `(userId, createdAt)` | Compound indexes make list/search/due queries index-only |
| `Review` | `(userId, reviewDate)` | Append-only recall log |
| `Challenge` | `(userId, challengeDate, wordId)` unique | Upsert guarantees one challenge per day |
| `PracticeAttempt` | `(userId, createdAt)` | Immutable attempt history |
| `UserExample` | `(userId, createdAt)` | Personal sentences |

All ownership queries filter by `userId` — one user can never read another's data.

## Key Flows

### Add word + AI enrichment

```
POST /api/words
 ├─ requireUser()
 ├─ createWordSchema.validate()
 ├─ duplicate check (case-insensitive unique per user)
  ├─ enrichWord() ── AI_API_KEY? ──► JSON-mode chat call
 │                          └── no key ──► deterministic fallback
 ├─ Word.create()
 └─ Promise.all [ refreshUserCounters, awardXP(+10), $addToSet category ]
```

### Spaced repetition review

```
POST /api/reviews { wordId, difficulty }
 ├─ scheduleReview(masteryLevel, difficulty, reviewCount)
 │    easy   → level + 2
 │    medium → level + 1
 │    hard   → level − 1, interval forced to 1 day
 │    interval = [1, 3, 7, 14, 30, 60][level]
 ├─ Word updated (masteryLevel, nextReviewDate, reviewCount)
 ├─ Review row inserted (audit log)
 └─ refresh counters + awardXP(+5/+7)
```

Mastery = level 5 (60-day interval) → counted in `masteredWords`.

### Edge-safe auth

```
middleware.ts ──► NextAuth(authConfig)   ← zero DB imports, JWT only
route handlers ─► NextAuth(full config)  ← providers + Mongo callbacks
```

Middleware only checks JWT presence to redirect; real authorization happens in
`requireUser()` inside every API handler and the app layout.

### AI graceful degradation

Every AI call site checks `aiAvailable()`:

- **No key** → deterministic fallback result, flagged `source: "fallback"`.
- **Key present but request fails** → same fallback, request never 500s.

UI badges surface offline mode so behavior is never mysterious.

## Scaling Notes

- **Reads:** all list endpoints paginate (`page`/`limit`) and sort via indexed fields.
- **Writes:** counter refreshes are aggregated counts, not increment drift.
- **Connection reuse:** cached `mongoose.connect` singleton per Node process.
- **Stateless servers:** JWT sessions → no session store needed for horizontal scaling.
- **Future mobile/extension:** `/api/*` is already a standalone contract
  (extension uses `X-API-Key`, mobile reuses session cookies/bearer).

## Security

- Passwords hashed with bcrypt (12 rounds), `select: false` at the schema level.
- API keys stored `select: false`, regenerable, only returned to the owner.
- Zod validation on every mutation endpoint.
- `middleware.ts` blocks unauthenticated access to both pages and APIs.
- OpenAI key stays server-side only; never sent to the client.
- Env secrets live in `.env.local` / Vercel env vars — never committed (`.gitignore`).
