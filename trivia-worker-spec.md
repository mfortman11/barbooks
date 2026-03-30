# Sports Trivia QR Redirect Worker — Spec & Deployment Guide

## Overview

Every QR code in the book points to a stable URL you control (`your-book-name.com/42`). A Cloudflare Worker handles that request, logs the scan, and redirects the user to the actual answer source. Because the redirect layer is decoupled from the printed QR codes, you can fix broken links, swap sources, or update answers any time — without reprinting anything.

```
QR Code → your-book-name.com/42 → Cloudflare Worker → logs scan → 301 redirect → answer source
```

**Total ongoing cost: ~$12/year** (domain only — everything else is on Cloudflare's free tier).

---

## Repo Structure

The worker lives alongside your existing Astro app in a monorepo. The two apps deploy independently — a redirect fix never requires touching the book generator.

```
sports-trivia-book/
├── apps/
│   ├── web/                    ← existing Astro app (book generator)
│   │   ├── src/
│   │   ├── public/
│   │   ├── astro.config.mjs
│   │   └── package.json
│   │
│   └── worker/                 ← Cloudflare Worker (new)
│       ├── src/
│       │   ├── index.ts        ← main request handler / router
│       │   ├── redirects.ts    ← KV read/write logic
│       │   ├── analytics.ts    ← Analytics Engine logging
│       │   ├── dashboard.ts    ← dashboard HTML renderer
│       │   └── admin.ts        ← protected admin endpoints
│       ├── wrangler.toml       ← Cloudflare config
│       └── package.json
│
├── package.json                ← root scripts tying the monorepo together
└── README.md
```

---

## URL Structure

| Route | Purpose |
|---|---|
| `your-book-name.com/42` | Redirects to answer source for question 42 |
| `your-book-name.com/dashboard` | Analytics dashboard |
| `your-book-name.com/admin/redirect/:id` | Update a redirect (auth protected) |

---

## Redirect Config — Cloudflare KV

Redirects are stored in a Cloudflare KV namespace called `REDIRECTS`. Keys are question numbers as strings; values are JSON objects (not raw URLs) so you can store metadata that powers the dashboard without a second lookup.

```json
"42": {
  "url": "https://en.wikipedia.org/wiki/NBA_MVP_Award",
  "label": "NBA MVPs all time",
  "category": "Basketball"
}
```

**Why KV over a JSON file in the repo:** updating a link is an API call or dashboard click — instant, no redeploy required. Important at 11pm when someone's at the bar with a broken QR code.

---

## Request Flow

```
Incoming request → parse slug

  → slug is a number
      1. Look up slug in KV REDIRECTS namespace
      2. If not found → return friendly 404 page
      3. Log scan event to Analytics Engine (non-blocking)
      4. Return 301 redirect to destination URL

  → slug is /dashboard
      → serve analytics dashboard page

  → slug is /admin/...
      → validate bearer token → handle admin action

  → anything else → 404
```

Analytics logging must never block the redirect. If the log write fails, the user is still redirected.

---

## Analytics — Cloudflare Analytics Engine

Each QR scan logs one event:

```json
{
  "question": 42,
  "label": "NBA MVPs all time",
  "category": "Basketball",
  "timestamp": "2026-03-29T22:14:00Z",
  "country": "US",
  "city": "Chicago",
  "platform": "iOS"
}
```

`country` and `city` come free from Cloudflare's request object — no IP lookup needed. `platform` is parsed from the User-Agent header.

### Why Analytics Engine over Supabase

At this scale (150 questions, bar-traffic volume) there's no need for a separate database. Analytics Engine is purpose-built for high-volume lightweight event logging, it's free, and it requires zero extra infrastructure.

---

## Dashboard (`/dashboard`)

A single-page view served by the worker. No separate frontend deployment needed.

**Displays:**
- Total scans — all time and last 30 days
- Top 10 most scanned questions
- Bottom 10 least scanned (dud detector — candidates to cut in a second edition)
- Scans by day (sparkline chart)
- Scans by hour of day — expect Friday/Saturday night spikes
- Breakdown by category if questions are tagged

No auth on the dashboard. The data isn't sensitive and keeping it open means your brothers can check it from their phones without any login flow. A password can be added later if needed.

### What the data tells you

| Signal | Interpretation |
|---|---|
| Never scanned | Too easy (didn't need to check) or too hard (gave up) |
| Most scanned | Most contested — good candidates for a "greatest hits" edition |
| Traffic spikes | When people are actually using the book |
| Zero scans after 6 months | Cut from the next edition |

---

## Admin Endpoints (Auth Protected)

Authentication uses a bearer token sent in the request header. The token is stored as an encrypted Cloudflare Worker secret — never in the repo.

```
PUT /admin/redirect/:id
Body: { "url": "https://new-url.com", "label": "...", "category": "..." }
→ Updates or creates a redirect in KV

DELETE /admin/redirect/:id
→ Removes a redirect (for questions cut from future editions)
```

These are the endpoints your Astro web app calls when you update a link from the book generator UI.

---

## Error States

| Situation | Behavior |
|---|---|
| Slug doesn't exist in KV | Friendly 404: *"This question may have moved or this code is from an older edition"* |
| Slug exists but URL is empty | Same friendly 404 |
| KV lookup fails | 503 — log the error to console |
| Analytics log fails | Still redirect — never block the user over a logging failure |

---

## Configuration Files

### `apps/worker/wrangler.toml`

```toml
name = "trivia-redirector"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "REDIRECTS"
id = "your-kv-namespace-id"        # filled in after one-time setup

[[analytics_engine_datasets]]
binding = "ANALYTICS"
dataset = "trivia_scans"

[vars]
ENVIRONMENT = "production"

# ADMIN_TOKEN is a secret — never stored here
# Set via: wrangler secret put ADMIN_TOKEN
```

### Root `package.json`

```json
{
  "name": "sports-trivia-book",
  "private": true,
  "scripts": {
    "dev:web": "cd apps/web && npm run dev",
    "dev:worker": "cd apps/worker && npx wrangler dev",
    "deploy:web": "cd apps/web && npm run build",
    "deploy:worker": "cd apps/worker && npx wrangler deploy"
  }
}
```

---

## Deployment

### Web App (unchanged)
Your Astro app continues to deploy to GitHub Pages exactly as it does today. Nothing changes.

### Worker (Cloudflare)
The worker has its own GitHub Actions workflow that triggers when anything in `apps/worker/**` changes.

```
Push to main (worker files changed)
  → GitHub Action runs
  → wrangler deploy
  → live in ~10 seconds globally
```

Two secrets need to be added to your GitHub repo settings (Settings → Secrets → Actions):

| Secret | Where to get it |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard → My Profile → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → right sidebar on Workers page |

### GitHub Actions Workflows

Two separate files — one per app — so a web change doesn't trigger a worker deploy and vice versa.

```
.github/
  workflows/
    deploy-web.yml      ← triggers on changes to apps/web/**
    deploy-worker.yml   ← triggers on changes to apps/worker/**
```

---

## One-Time Setup Sequence

Run these once to get everything wired up. Total time: ~20 minutes.

```bash
# 1. Install Wrangler (Cloudflare's CLI)
npm install -g wrangler

# 2. Authenticate with your Cloudflare account
wrangler login

# 3. Create the KV namespace
wrangler kv:namespace create REDIRECTS
# → outputs a namespace ID, paste it into wrangler.toml

# 4. Set the admin token (you choose the value, it's stored encrypted)
wrangler secret put ADMIN_TOKEN

# 5. First deploy
cd apps/worker && wrangler deploy

# 6. In Cloudflare dashboard → Workers & Pages → your worker
#    → Settings → Triggers → Add Custom Domain
#    → enter your-book-name.com
```

Steps 1–5 are terminal commands. Step 6 is a few clicks in the browser. After step 6, your domain is live and pointing at the worker within a few minutes.

---

## Infrastructure Summary

| Piece | Service | Cost |
|---|---|---|
| Worker runtime | Cloudflare Workers | Free (100k req/day) |
| Redirect storage | Cloudflare KV | Free |
| Analytics storage | Cloudflare Analytics Engine | Free |
| Domain | Cloudflare Registrar or Namecheap | ~$12/yr |
| CI/CD | GitHub Actions | Free |

---

## Build Order

When writing the code, implement in this sequence so you can test each layer before building on it:

1. **`src/index.ts`** — request router. Gets everything else hanging off it.
2. **`src/redirects.ts`** — KV read/write. Test with a few dummy entries.
3. **`src/analytics.ts`** — event logging. Confirm events appear in Analytics Engine.
4. **`src/admin.ts`** — protected endpoints. Wire up to the Astro web app.
5. **`src/dashboard.ts`** — analytics dashboard. Build last once data is flowing.
