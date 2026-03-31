# OnTonight — CLAUDE.md

React/Vite event aggregation calendar for Toronto/GTA. Shows concerts, festivals, sports, theatre from multiple APIs in a calendar + discovery feed UI.

**Tagline:** Everything happening tonight.

**Roadmap:** `OnTonight_Roadmap.md` — 8 phases. Follow in order.

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
| Frontend (Vercel) | https://ontonight-three.vercel.app |
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
FRONTEND_URL=https://ontonight-three.vercel.app
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
| 2 — Real APIs | ✅ Complete | Ticketmaster live, 500 events syncing, UI fully built |
| 3 — User Accounts | ⬜ Not started | Supabase Auth + profiles |
| 4 — User Submissions | ⬜ Not started | |
| 5 — Map View | ⬜ Not started | Needs Mapbox token |
| 6 — Discovery Engine | ⬜ Not started | Needs ANTHROPIC_API_KEY |
| 7 — Mobile/PWA | ⬜ Not started | Needs VAPID keys |
| 8 — Monetization | ⬜ Not started | Needs Stripe keys |

---

## Current UI State (2026-03-30)

`src/OnTonight.jsx` is the single main component. Key features shipped:

- Monthly calendar with relative density gradient (warm → amber → red based on max events that month)
- Event modal with full-bleed image, ticket CTA, "Find tickets" fallback search link
- 3-column layout: calendar (380px) | event list (flex) | My Night panel (268px)
- My Night panel: saved events list, Account placeholder, Live Sources block
- Category filter pills (stats strip + calendar sidebar)
- Location filter: GTA area presets (12 areas incl. Hamilton, Burlington) + geolocation + radius picker
- First-visit onboarding: location modal auto-opens if no saved location in localStorage
- Like animation: heart spring-bounce on save
- Bottom toast: "Saved to your night." / "Reminder set for…"
- Phosphor icons throughout (Clock, MapPin, Heart, Bell, X, Ticket) — no emojis in UI
- Empty states, error states, loading skeletons

Dependencies added this session: `@phosphor-icons/react`

---

## Phase 3 Starting Point

- Supabase Auth (email + Google OAuth)
- Profile page
- Persist liked/notified events to `saved_events` table
- Wire `Sign in` button in My Night panel → hero nav

---

## Jason To-Do (manual actions required)

- [ ] **Trigger a fresh sync** — `POST /api/admin/sync` with `x-admin-key` header. Sync center changed from `city=Toronto` to `latlong=43.50,-79.65` (GTA center, r=100km). Fresh sync will populate Hamilton/Burlington venues so the location filter works there.
- [ ] **Get API keys** for Songkick, Bandsintown, Eventbrite when ready to add more sources
- [ ] **Decide on project name** before Phase 3 — rename repo + Vercel + Railway + Supabase (painful to rename later)

---

## Next Code Tasks (Claude to-do)

- [ ] Narrow Ticketmaster sync date window — add `startDateTime`/`endDateTime` params (current month + 30 days) to avoid 500-event cap being filled by stale future events
- [ ] Add `GET /api/sync-status` endpoint — return `{ lastSync, sources: { ticketmaster: { count, lastSync } } }` and wire to Live Sources panel
- [ ] Framer Motion polish (P3): morphing card→modal (`layoutId`), staggered card load-in, calendar hover tooltips — needs `npm install framer-motion`
- [ ] Multi-source ingestion: write fetcher services for Songkick / Bandsintown / Eventbrite (after API keys acquired)

---

## Known Gotchas

- **`npm install` won't run in the Claude VM** — Railway runs it at deploy time
- **Claude VM proxy blocks GitHub** — use github.dev (browser VS Code) to commit manually
- **`node-cron` must be in `server/package.json`** — confirm before Railway deploys
- **Admin sync endpoint** requires `x-admin-key` header matching `ADMIN_PASSWORD` env var
- **`.github/workflows/deploy.yml`** — old GitHub Pages deploy, may need disabling (Vercel handles deploys now)
- **Ticketmaster 500-event cap** — free tier max is ~1000 results (size=200 × 5 pages). Currently hitting ~500 due to rate limit backoff. Date-window narrowing will help.

---

## Supabase Schema Notes

- `events.source` — where event came from: `'ticketmaster'`, `'user_submission'`, etc.
- `events.is_verified` — only `true` events returned by `/api/events` GET
- `events.source_id` — external ID, `UNIQUE(source, source_id)` prevents duplicates
- `profiles.id` — references `auth.users(id)` from Supabase Auth
- `venues.latitude` / `venues.longitude` — populated by Ticketmaster sync, used for client-side haversine distance filter
