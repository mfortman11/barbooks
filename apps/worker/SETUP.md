# Cloudflare Worker Setup Guide

One-time setup to get the redirect worker live. Takes about 20 minutes.

---

## Prerequisites

- A Cloudflare account (free tier is fine)
- A domain you control, added to Cloudflare as your DNS provider
- Node.js installed locally

---

## Step 1 — Install Wrangler

Wrangler is Cloudflare's CLI. Install it globally:

```bash
npm install -g wrangler
```

---

## Step 2 — Log In to Cloudflare

```bash
wrangler login
```

This opens a browser window. Authorize Wrangler to access your account. When it says "Wrangler is now configured with your login", you're done.

---

## Step 3 — Create the KV Namespace

The redirect table lives in Cloudflare KV. Create the namespace:

```bash
cd apps/worker
wrangler kv:namespace create REDIRECTS
```

The output will look like:

```
✅ Created namespace "REDIRECTS" with id "abc123def456..."
```

Copy that ID, then open `apps/worker/wrangler.toml` and replace the placeholder:

```toml
[[kv_namespaces]]
binding = "REDIRECTS"
id = "abc123def456..."   # ← paste your real ID here
```

---

## Step 4 — Set the Admin Token

The admin token protects the `PUT /admin/redirect/:id` and `DELETE /admin/redirect/:id` endpoints. It's stored as an encrypted secret — never in the repo.

Pick any string you want as your token (a long random string is best):

```bash
wrangler secret put ADMIN_TOKEN
```

Wrangler will prompt you to enter the value. Type or paste your token and hit Enter.

Save this token somewhere safe (a password manager). You'll need it when updating redirects.

---

## Step 5 — First Deploy

```bash
cd apps/worker
wrangler deploy
```

You'll see output like:

```
✅ Deployed trivia-redirector to workers.dev
   https://trivia-redirector.your-account.workers.dev
```

Test it at that URL — hitting `/dashboard` should return the dashboard page.

---

## Step 6 — Connect Your Domain

This makes `your-domain.com/42` work instead of the `.workers.dev` URL.

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Open **Workers & Pages** → find `trivia-redirector`
3. Go to **Settings → Triggers → Custom Domains**
4. Click **Add Custom Domain** and enter your domain (e.g. `trivia.yourdomain.com`)
5. Cloudflare automatically provisions a certificate and sets up DNS

Within a few minutes your domain is live and pointing at the worker.

---

## Step 7 — Add Your First Redirects

Use the admin endpoint to load questions into KV. You'll need:
- Your domain from Step 6
- Your admin token from Step 4

Example — adding question 42:

```bash
curl -X PUT https://your-domain.com/admin/redirect/42 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://en.wikipedia.org/wiki/NFL_MVP", "label": "NFL MVPs all time", "category": "NFL"}'
```

Test it by visiting `https://your-domain.com/42` in your browser — it should redirect to the Wikipedia page.

---

## Step 8 — Wire Up GitHub Actions (CI/CD)

So that `git push` deploys the worker automatically:

1. Go to your GitHub repo → **Settings → Secrets and variables → Actions**
2. Add two repository secrets:

| Secret name | Where to get it |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard → [My Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens) → Create Token → use the **Edit Cloudflare Workers** template |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → right sidebar on the Workers & Pages overview page |

From now on, any push to `main` that touches `apps/worker/**` will automatically redeploy.

---

## Common Operations

### Update a redirect

When an answer source URL changes, no reprint needed — just update the KV entry:

```bash
curl -X PUT https://your-domain.com/admin/redirect/42 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://new-url.com", "label": "NFL MVPs all time", "category": "NFL"}'
```

The change is live instantly.

### Delete a redirect

For questions cut from future editions:

```bash
curl -X DELETE https://your-domain.com/admin/redirect/42 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Check the dashboard

Open `https://your-domain.com/dashboard` in any browser — no login needed.

### Run the worker locally

```bash
cd apps/worker
npm run dev
```

The worker runs at `http://localhost:8787`. KV reads/writes hit Cloudflare's remote KV (it's not mocked locally unless you add a local KV binding in `wrangler.toml`).

---

## Cost

| Service | Plan | Cost |
|---|---|---|
| Cloudflare Workers | Free (100k req/day) | $0 |
| Cloudflare KV | Free | $0 |
| Cloudflare Analytics Engine | Free | $0 |
| Domain | Cloudflare Registrar or Namecheap | ~$12/yr |
| GitHub Actions | Free | $0 |

---

## Troubleshooting

**`wrangler deploy` fails with "KV namespace not found"**
The ID in `wrangler.toml` doesn't match the one Cloudflare has. Re-run `wrangler kv:namespace list` to check the real ID and update `wrangler.toml`.

**Admin endpoint returns 401**
The `Authorization` header doesn't match the stored secret. Re-run `wrangler secret put ADMIN_TOKEN` to reset it.

**Domain not resolving after Step 6**
DNS propagation can take up to a few minutes. Also confirm the domain's nameservers are pointing to Cloudflare — the domain must be managed through Cloudflare DNS for custom worker triggers to work.

**Scans not showing in Analytics Engine**
Analytics Engine data has a ~5 minute delay before it's queryable. If events still don't appear after 10 minutes, check the worker logs in the Cloudflare dashboard (Workers → your worker → Logs).
