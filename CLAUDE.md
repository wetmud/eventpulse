# EventPulse — Claude Session State
> Read this at the start of every session. It tells you exactly where we are and what to do next.

---

## 🏗 Project Overview

**What it is:** A React/Vite event aggregation calendar for the Toronto/GTA area. Shows concerts, festivals, sports, theatre etc. from multiple APIs in a beautiful calendar + discovery feed UI.

**The goal:** Transform a static GitHub Pages demo into a real, live product with a real backend, real API data, and real users.

**Roadmap file:** `EventPulse_Roadmap.md` — 8 phases total. Follow in order. Stop at the end of each main task and confirm it works before moving on.

**GitHub repo:** `https://github.com/wetmud/eventpulse`

**Owner:** Jason (jason.steltman@gmail.com)

---

## 🖥 Tech Stack

| Layer | Service | Notes |
|-------|---------|-------|
| Frontend | **Vercel** | Auto-deploys from GitHub `main`. NOT YET SET UP. |
| Backend | **Railway** | Node.js/Express. Root directory = `/server`. Running on port 3001. |
| Database | **Supabase** | PostgreSQL. Project ID: `jrdfcngdggqanjgxohjk`. Region: US East. |
| Cache | Upstash Redis | Not yet set up (Phase 1 stretch goal) |
| File storage | Supabase Storage | Not yet set up |

---

## 📍 Current Phase: Phase 2 — Real APIs

### ✅ Phase 1 COMPLETE

**Step 1.1 — Stack chosen:** Vercel + Railway + Supabase

**Step 1.2 — Supabase project created and schema run:**
- Project URL: `https://jrdfcngdggqanjgxohjk.supabase.co`
- Tables created: `venues`, `events`, `profiles`, `saved_events`, `follows` + all indexes ✅

**Step 1.3 — Backend live on Railway:**
- Public URL: `https://eventpulse-production-0256.up.railway.app`
- Health check confirmed: `{"status":"ok"}` ✅
- All 15 environment variables set ✅

**Step 1.4 — Frontend live on Vercel:**
- URL: `https://eventpulse-ednedbs9o-wetmuds-projects.vercel.app`
- Auto-deploys from GitHub `main` ✅
- All 3 VITE env vars set (API URL, Supabase URL, Supabase anon key) ✅

**Step 1.5 — CORS locked down:**
- `FRONTEND_URL` in Railway set to the Vercel domain ✅

---

## 📁 Files Created This Session

All new server files are at `/server/`. Frontend changes are in `/src/` and the root.

```
eventpulse/
├── .env.example              ← NEW: template for Vercel env vars
├── .gitignore                ← NEW: ignores node_modules, .env, dist, logs
├── vite.config.js            ← MODIFIED: removed base: '/eventpulse/' (was GitHub Pages only)
├── src/
│   └── lib/
│       └── supabase.js       ← NEW: Supabase client for frontend (uses VITE_ env vars)
└── server/
    ├── package.json          ← NEW: Express server dependencies
    ├── index.js              ← NEW: Main Express app, Supabase client, routes, health check
    ├── .env.example          ← NEW: template for Railway env vars
    ├── .gitignore            ← NEW: ignores server/node_modules, .env
    ├── routes/
    │   ├── events.js         ← NEW: GET /api/events, GET /api/events/:id, POST /api/events/submit
    │   ├── venues.js         ← NEW: GET /api/venues, GET /api/venues/:id
    │   └── admin.js          ← NEW: protected admin routes (pending, approve, reject, sync)
    └── middleware/
        ├── auth.js           ← NEW: x-admin-key header check against ADMIN_PASSWORD env var
        └── rateLimit.js      ← NEW: apiLimiter (200/15min), strictLimiter (20/min)
```

### Key code notes:
- Server uses **ESM modules** (`"type": "module"` in server/package.json) — use `import/export`, not `require`
- Supabase client exported from `server/index.js` and imported by routes
- Admin routes protected by `x-admin-key` request header
- CORS origin set from `FRONTEND_URL` env var (falls back to `*` if not set)

---

## 🔑 Environment Variables

### Railway (Backend) — all 15 are set
```
SUPABASE_URL=https://jrdfcngdggqanjgxohjk.supabase.co
SUPABASE_SERVICE_KEY=[service role JWT — already in Railway]
TICKETMASTER_API_KEY=OTq1WeQGQGUDeVwf7Q3kCL5hyBTRxcKZ
PORT=3001
FRONTEND_URL=[set this once Vercel URL is known]
ADMIN_PASSWORD=[auto-generated in Railway]
BANDSINTOWN_APP_ID=[placeholder]
MAPBOX_SECRET_TOKEN=[placeholder]
STRIPE_SECRET_KEY=[placeholder]
RESEND_API_KEY=[placeholder — needed for Phase 3]
ANTHROPIC_API_KEY=[placeholder — needed for Phase 6]
VAPID_PUBLIC_KEY=[placeholder — needed for Phase 7]
VAPID_PRIVATE_KEY=[placeholder — needed for Phase 7]
SONGKICK_API_KEY=[placeholder]
EVENTBRITE_API_KEY=[placeholder]
```

### Vercel (Frontend) — NOT SET UP YET
```
VITE_API_URL=https://[railway-domain].railway.app
VITE_SUPABASE_URL=https://jrdfcngdggqanjgxohjk.supabase.co
VITE_SUPABASE_ANON_KEY=[get from Supabase → Settings → API → anon public key]
VITE_MAPBOX_TOKEN=[placeholder — needed for Phase 5]
VITE_VAPID_PUBLIC_KEY=[placeholder — needed for Phase 7]
VITE_STRIPE_PUBLIC_KEY=[placeholder — needed for Phase 8]
```

---

## 🗄 Supabase Schema

Schema to run in Supabase SQL Editor (copy from `EventPulse_Roadmap.md` Step 1.2):

Tables: `venues`, `events`, `profiles`, `saved_events`, `follows`

Key field notes:
- `events.source` — where event came from: `'ticketmaster'`, `'eventbrite'`, `'user_submission'`, etc.
- `events.is_verified` — only `true` events returned by `/api/events` GET
- `events.source_id` — external API ID, used with `UNIQUE(source, source_id)` to prevent duplicates
- `profiles.id` — references `auth.users(id)` from Supabase Auth

---

## ✅ NEXT STEPS — Phase 2: Real APIs

### 1. Build the Ticketmaster sync service
Create two new files:
- `/server/services/ticketmaster.js` — fetches + normalizes events from Ticketmaster Discovery API
- `/server/services/sync.js` — orchestrates sources, upserts into Supabase, runs on cron

The Ticketmaster API key is already in Railway: `OTq1WeQGQGUDeVwf7Q3kCL5hyBTRxcKZ`

GTA query:
```
https://app.ticketmaster.com/discovery/v2/events.json
  ?apikey=OTq1WeQGQGUDeVwf7Q3kCL5hyBTRxcKZ
  &city=Toronto
  &countryCode=CA
  &radius=80
  &unit=km
  &size=200
```

Category mapping (Ticketmaster segment → our category):
```js
const CATEGORY_MAP = {
  'Music': 'Concerts',
  'Sports': 'Sports',
  'Arts & Theatre': 'Theatre',
  'Film': 'Other',
  'Miscellaneous': 'Other',
  'Comedy': 'Comedy',
  'Family': 'Festivals',
};
```

### 2. Add cron to server/index.js
```js
import cron from 'node-cron';
import { syncAllSources } from './services/sync.js';
cron.schedule('0 */6 * * *', () => syncAllSources());
```

### 3. Refactor EventPulse.jsx to use real data
Install React Query: `npm install @tanstack/react-query`
Replace seeded demo data with fetch from `${VITE_API_URL}/api/events?month=X&year=Y`

### 4. Phase 2 sign-off
- Trigger a manual sync via `POST /api/admin/sync` (with x-admin-key header)
- Verify events appear in Supabase Table Editor
- Verify frontend calendar shows real events

---

## 🌐 Live URLs

| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://eventpulse-ednedbs9o-wetmuds-projects.vercel.app |
| Backend (Railway) | https://eventpulse-production-0256.up.railway.app |
| Health check | https://eventpulse-production-0256.up.railway.app/api/health |
| Supabase dashboard | https://supabase.com/dashboard/project/jrdfcngdggqanjgxohjk |

---

## ⚠️ Known Issues / Gotchas

- **`npm install` won't run in the Claude VM** — Railway runs it at deploy time. Don't try to test the server locally from the VM.
- **GitHub Actions deploy.yml** exists at `.github/workflows/deploy.yml` — this was the old GitHub Pages deploy. It may need to be updated or disabled now that we're using Vercel.
- **vite.config.js** no longer has `base: '/eventpulse/'` — the old GitHub Pages URL (`wetmud.github.io/eventpulse/`) will break. That's intentional — Vercel is the new home.
- **CORS** is currently set to `*` (wildcard) until `FRONTEND_URL` is set in Railway.

---

## 📋 Roadmap Progress

| Phase | Status | Notes |
|-------|--------|-------|
| 1 — Foundation | ✅ Complete | Railway + Vercel + Supabase all live |
| 2 — Real APIs | 🟡 Up Next | Ticketmaster key ready, sync service to build |
| 3 — User Accounts | ⬜ Not started | |
| 4 — User Submissions | ⬜ Not started | |
| 5 — Map View | ⬜ Not started | Need Mapbox token |
| 6 — Discovery Engine | ⬜ Not started | |
| 7 — Mobile/PWA | ⬜ Not started | |
| 8 — Monetization | ⬜ Not started | |

---

*Last updated: March 6, 2026 — Phase 1 complete, starting Phase 2*
