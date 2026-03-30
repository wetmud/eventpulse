# OnTonight

Everything happening tonight. Local event discovery for the Greater Toronto Area — aggregates concerts, festivals, sports, and theatre from multiple sources into a single calendar and discovery feed.

![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-in%20active%20development-yellow)

---

<!-- Screenshot placeholder: add a screenshot of the calendar + event list UI here -->
<!-- Suggested path: docs/screenshot.png -->

---

## Features

- Monthly calendar view with event density indicators — click a date to filter the list
- Scrollable event list synced to calendar selection
- Live event data pulled from Ticketmaster (syncs every 6 hours via cron)
- Event deduplication by `source + source_id` — no duplicate listings
- Category filtering: Concerts, Sports, Theatre, Festivals, Comedy
- Search by title, artist, or venue
- Like and notify buttons per event (in-memory; persistence requires auth)
- Admin sync endpoint for manually triggering an API pull
- Rate limiting and CORS locked to the deployed frontend

---

## Tech Stack

| Layer | Tool | Notes |
|-------|------|-------|
| Frontend | React + Vite | TanStack Query for data fetching |
| Frontend hosting | Vercel | Auto-deploys from `main` |
| Backend | Node.js + Express | Cron sync, REST API |
| Backend hosting | Railway | Root: `/server` |
| Database | Supabase (PostgreSQL) | Events, venues, profiles, saved events, follows |
| Auth | Supabase Auth | Not yet wired to the UI — Phase 3 |

---

## Project Structure

```
eventpulse/
├── index.html
├── vite.config.js
├── package.json
├── src/
│   ├── main.jsx              # QueryClientProvider wrapper
│   ├── OnTonight.jsx         # Main app component
│   └── lib/
│       └── supabase.js       # Supabase JS client
└── server/
    ├── index.js              # Express app + cron scheduler
    ├── package.json
    ├── routes/
    │   ├── events.js         # GET /api/events, GET /api/events/:id
    │   ├── venues.js         # GET /api/venues
    │   └── admin.js          # Protected: sync, approve, reject
    ├── middleware/
    │   ├── auth.js           # x-admin-key header check
    │   └── rateLimit.js      # 200 req/15min general, 20 req/min strict
    └── services/
        ├── ticketmaster.js   # Ticketmaster Discovery API fetcher
        └── sync.js           # Supabase upsert orchestrator
```

---

## Setup

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with the schema below
- A [Ticketmaster Developer](https://developer.ticketmaster.com) API key
- Accounts on [Vercel](https://vercel.com) and [Railway](https://railway.app) for hosting (or run both locally)

### Frontend

```bash
# Install dependencies
npm install

# Copy and fill in env vars
cp .env.example .env.local

# Run dev server
npm run dev
# http://localhost:5173
```

**Frontend env vars (`.env.local`):**

```
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend

```bash
cd server

# Install dependencies
npm install

# Copy and fill in env vars
cp .env.example .env

# Start the server
node index.js
# http://localhost:3001
```

**Backend env vars (`server/.env`):**

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
TICKETMASTER_API_KEY=your_ticketmaster_key
ADMIN_PASSWORD=a_secret_key_for_the_admin_endpoints
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### Database Schema

Run the full schema in the Supabase SQL editor. Tables: `venues`, `events`, `profiles`, `saved_events`, `follows`. See `EventPulse_Roadmap.md` for the complete SQL.

Key constraints:
- `events(source, source_id)` — unique constraint used for deduplication on sync
- `profiles.id` references `auth.users(id)` from Supabase Auth

### Triggering a Manual Sync

Once the backend is running and `TICKETMASTER_API_KEY` is set:

```bash
curl -X POST http://localhost:3001/api/admin/sync \
  -H "x-admin-key: YOUR_ADMIN_PASSWORD"
```

---

## Live URLs

| Service | URL |
|---------|-----|
| Frontend | https://eventpulse-ednedbs9o-wetmuds-projects.vercel.app |
| Backend health | https://eventpulse-production-0256.up.railway.app/api/health |

---

## Status / Roadmap

This is a portfolio project in active development. Phases 1 and 2 (infrastructure + real API data) are complete. Phase 3 (user accounts) is the current priority.

| Phase | Status | Description |
|-------|--------|-------------|
| 1 — Foundation | Complete | Railway + Vercel + Supabase all live |
| 2 — Real APIs | Complete (pending Railway deploy verification) | Ticketmaster sync, cron, dedup |
| 3 — User Accounts | Not started | Supabase Auth, saved events, profile page |
| 4 — User Submissions | Not started | Submit events, moderation queue |
| 5 — Map View | Not started | Mapbox, event pins, geolocation |
| 6 — Discovery Engine | Not started | Personalized feed, trending, Claude API recs |
| 7 — Mobile / PWA | Not started | Installable, push notifications |
| 8 — Monetization | Not started | Affiliate links, promoted listings, venue pro |

---

## License

MIT
