# EventPulse — CLAUDE.md

React/Vite event aggregation calendar for Toronto/GTA. Shows concerts, festivals, sports, theatre from multiple APIs in a calendar + discovery feed UI.

**Roadmap:** `EventPulse_Roadmap.md` — 8 phases. Follow in order.

---

## Tech Stack

| Layer | Service | Notes |
|-------|---------|-------|
| Frontend | **Vercel** | Auto-deploys from GitHub `main` |
| Backend | **Railway** | Node.js/Express, root dir = `/server`, port 3001 |
| Database | **Supabase** | PostgreSQL, project ID: `jrdfcngdggqanjgxohjk`, US East |

---

## Live URLs

| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://eventpulse-ednedbs9o-wetmuds-projects.vercel.app |
| Backend (Railway) | https://eventpulse-production-0256.up.railway.app |
| Health check | https://eventpulse-production-0256.up.railway.app/api/health |
| Supabase dashboard | https://supabase.com/dashboard/project/jrdfcngdggqanjgxohjk |

---

## Environment Variables

### Railway (Backend)
```
SUPABASE_URL=https://jrdfcngdggqanjgxohjk.supabase.co
SUPABASE_SERVICE_KEY=[in Railway]
TICKETMASTER_API_KEY=OTq1WeQGQGUDeVwf7Q3kCL5hyBTRxcKZ
PORT=3001
FRONTEND_URL=https://eventpulse-ednedbs9o-wetmuds-projects.vercel.app
ADMIN_PASSWORD=[in Railway]
RESEND_API_KEY=[placeholder — Phase 3]
ANTHROPIC_API_KEY=[placeholder — Phase 6]
VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY=[placeholder — Phase 7]
```

### Vercel (Frontend)
```
VITE_API_URL=https://eventpulse-production-0256.up.railway.app
VITE_SUPABASE_URL=https://jrdfcngdggqanjgxohjk.supabase.co
VITE_SUPABASE_ANON_KEY=[in Vercel]
VITE_MAPBOX_TOKEN=[placeholder — Phase 5]
VITE_STRIPE_PUBLIC_KEY=[placeholder — Phase 8]
```

---

## Roadmap

| Phase | Status | Notes |
|-------|--------|-------|
| 1 — Foundation | ✅ Complete | Railway + Vercel + Supabase all live |
| 2 — Real APIs | 🟡 Deploy pending | Code complete, needs Railway config fix + sync trigger |
| 3 — User Accounts | ⬜ Not started | Supabase Auth + profiles |
| 4 — User Submissions | ⬜ Not started | |
| 5 — Map View | ⬜ Not started | Needs Mapbox token |
| 6 — Discovery Engine | ⬜ Not started | Needs ANTHROPIC_API_KEY |
| 7 — Mobile/PWA | ⬜ Not started | Needs VAPID keys |
| 8 — Monetization | ⬜ Not started | Needs Stripe keys |

---

## Phase 2 Sign-Off (still needed)

Railway kept trying to run `vite build` from the wrong directory. Correct settings:
- Root Directory: *(blank)*
- Build Command: `cd server && npm install`
- Start Command: `cd server && node index.js`

Once Railway is green:
1. Trigger manual sync: `POST /api/admin/sync` with header `x-admin-key: [ADMIN_PASSWORD]`
2. Verify events appear in Supabase → `events` table
3. Verify frontend calendar shows real events

---

## Phase 3 Starting Point

- Supabase Auth (email + Google OAuth)
- Profile page
- Persist liked/notified events to `saved_events` table
- Wire `Sign in` button in hero nav

---

## Known Gotchas

- **`npm install` won't run in the Claude VM** — Railway runs it at deploy time
- **Claude VM proxy blocks GitHub** — use github.dev (browser VS Code) to commit manually
- **`node-cron` must be in `server/package.json`** — confirm before Railway deploys
- **Admin sync endpoint** requires `x-admin-key` header matching `ADMIN_PASSWORD` env var
- **`.github/workflows/deploy.yml`** — old GitHub Pages deploy, may need disabling (Vercel handles deploys now)

---

## Supabase Schema Notes

- `events.source` — where event came from: `'ticketmaster'`, `'user_submission'`, etc.
- `events.is_verified` — only `true` events returned by `/api/events` GET
- `events.source_id` — external ID, `UNIQUE(source, source_id)` prevents duplicates
- `profiles.id` — references `auth.users(id)` from Supabase Auth
