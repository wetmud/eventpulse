# EventPulse — Strategic Plan
*Generated March 2026 via 7-agent planning session (agency-agents framework)*

---

## The Thesis

**EventPulse is the only Toronto-native event layer that aggregates across sources, personalizes by taste, and treats the GTA's full cultural calendar as the product — not an afterthought.**

Toronto event discovery is genuinely broken. Residents plan their social lives across Instagram, Facebook Events, Resident Advisor, Songkick, and venue newsletters simultaneously. The problem isn't access to event information — it's the cognitive load of aggregating it. EventPulse eliminates that tax.

---

## Current Honest State

| Layer | Status | Key Issue |
|-------|--------|-----------|
| Frontend | Live on Vercel | "Sign in" button dead; like/notify state resets on reload; hardcoded hero stats |
| Backend | Live on Railway | Phase 2 deploy config broken — real events may not be loading |
| Database | Supabase live | Schema is solid; `saved_events` and auth tables not yet wired |
| Events pipeline | Code complete | City filter bug via join; no sync logging; single source |
| Auth | Not started | Phase 3 |

**The #1 metric that matters right now: weekly active returners.** Not signups. Not pageviews. Until someone comes back next week without being pushed, nothing else matters.

---

## The User (Who We're Building For)

**Culturally Active Professional (25–40)**
Goes out 2–4x/month. Books 2–6 weeks ahead. Checks multiple sources. Would pay for the right tool but won't tolerate friction. High CLV.

**The Social Coordinator (28–45)**
Plans group outings. Values comprehensive coverage. Most likely to share and refer.

**Curious Tourist / New Resident**
Doesn't know the city's landscape. High discovery need, zero loyalty to existing tools. Easiest conversion if the product works on first use.

---

## Competitive Landscape

| Competitor | Weakness to Exploit |
|------------|-------------------|
| Ticketmaster | Pure commerce, zero discovery intent |
| Eventbrite | US-centric, weak Toronto filtering, flooded with webinars |
| Do416 | Strong editorial voice but manual curation — doesn't scale, no personalization |
| Facebook Events | Requires Facebook; dying among under-35s; algorithmic, not intentional |
| Meetup | Niche (professional groups), not mainstream culture |

**The gap:** No tool aggregates across sources AND personalizes by taste AND serves Toronto-first intent without requiring a social graph. GTA's multicultural calendar (Eid, Caribana, Lunar New Year, Diwali) is chronically under-indexed everywhere.

---

## Emerging Trends to Ride

1. **AI taste matching** — users expect Spotify Discover Weekly logic applied to live events. Category filters feel broken in 2026.
2. **Hyper-local, neighbourhood-scale discovery** — "what's happening in Kensington this Saturday" is unsolved.
3. **Calendar-native UX** — event discovery is shifting from feed-scroll to intent-based calendar views, especially millennial/Gen Z planners.

---

## 90-Day Priorities

### Priority 1: Close Phase 2 (1 hour)
The entire product premise collapses without real, current event data. Fix the Railway deploy, trigger sync, verify events render. This is the prerequisite for everything.

**Exact steps:**
1. Railway dashboard → Root Directory: *(blank)*, Build: `cd server && npm install`, Start: `cd server && node index.js`
2. Verify: `GET https://eventpulse-production-0256.up.railway.app/api/health`
3. Trigger sync: `POST /api/admin/sync` with `x-admin-key: [ADMIN_PASSWORD]`
4. Verify: Supabase `events` table has rows with `is_verified = true`
5. Verify: Vercel frontend shows real events in calendar

### Priority 2: Ship Phase 3 — Persistence-First Auth (3–4 days)
The goal isn't auth for its own sake — it's giving users a reason to return. Saved events that persist across sessions is the minimum viable hook. This also unlocks Phase 4–6 (you need users before you can personalize).

### Priority 3: Acquire 25 real users, talk to 5 (ongoing)
Soft launch to r/toronto, local Facebook groups, Discord servers. Track return visits. Phases 4–8 should be driven by what those users actually do.

### What NOT to Build in the Next 90 Days
- **Map view (Phase 5)** — nice to have, Mapbox cost + complexity, no evidence users need it to return
- **User submissions (Phase 4)** — moderation overhead you can't handle solo
- **AI recommendations (Phase 6)** — personalization requires behavioral data; you have no users yet
- **PWA/push (Phase 7)** — push opt-in rates on mobile web are 5–10%; come back after 1k MAU

---

## Phase 3 Task List

| Task | What | Effort |
|------|------|--------|
| 3.1 | Supabase auth client: create `src/lib/supabase.js`, wire env vars | S (30m) |
| 3.2 | `AuthModal.jsx`: email/password + Google OAuth, sign-in + sign-up views | M (2h) |
| 3.3 | Wire "Sign in" button → AuthModal; store session in Zustand; show avatar when logged in | S (1h) |
| 3.4 | DB trigger: auto-create `profiles` row on `auth.users` insert | S (30m) |
| 3.5 | Persist likes/notifies: upsert to `saved_events` when logged in; localStorage fallback when logged out | M (2h) |
| 3.6 | On app load: fetch user's saved events and hydrate state | S (1h) |
| 3.7 | `/profile` route: list saved events + sign-out button | S (1h) |

**Total: ~3–4 days of focused sessions**

---

## Phase Sequencing — Keep Original Order

Original order is correct. Rationale:
- Phase 3 (auth) is prerequisite for Phase 4 (submissions need a submitter) and Phase 6 (personalization needs a user graph)
- Phase 5 (map) needs lat/lng data quality that improves with more ingestion time
- Phase 6 (AI) needs behavioral data (saves, follows) that only accumulates after Phase 3

**Exception:** Phase 7 (PWA) is a 1-day task — consider it immediately before any launch announcement since mobile is where Toronto event discovery actually happens.

### Phase Unlock Analysis
**Phase 3 is the highest-leverage unlock.** Once users can save events:
- You have a retention loop (reasons to return)
- You have behavioral data for Phase 6
- You can capture emails for notification-driven re-engagement
- Promoted listings (Phase 8) become sellable — venues care about saves, not just views

---

## Risk Flags by Phase

| Phase | Hidden Risk | Mitigation |
|-------|------------|------------|
| Phase 2 | Ticketmaster venue records have inconsistent lat/lng and missing images | Won't surface until 500+ events loaded; accept for now |
| Phase 4 | User submissions = ongoing moderation load with no tooling | Gate behind auth, track `submitted_by`, defer until user base established |
| Phase 5 | City filtering is currently broken (join-based, silently returns all) | Denormalize `city` onto `events` table at sync time |
| Phase 6 | Cold-start: personalization useless until save history exists. Estimate 3–5 days is really 7–10 days | Don't start until 3 months of user behavior data; scope tightly |
| Phase 7 | Push opt-in rates 5–10% on web; VAPID + service worker complexity is 2x estimate | Ship PWA manifest only first; add push after 1k MAU |

---

## Architecture Decisions (ADRs)

### ADR-1: Use Supabase RLS for auth, not Express middleware
**Recommendation:** RLS policies handle row-level auth for reads; Express service key only for writes and admin operations.
**Trade-off:** RLS policies less visible than code, but eliminates entire auth middleware layer.

### ADR-2: No ORM
Keep raw Supabase client queries. Don't add Prisma or Sequelize.
**Trade-off:** No type-safe schema, but avoids migration dependency chain that will slow every future schema change.

### ADR-3: Split EventPulse.jsx before Phase 3
Extract auth state into a context provider; calendar/feed into separate route components.
**Trade-off:** Half a day now vs. two days debugging auth state leaking into display logic later.

---

## Backend Quick Fixes (Do Before Phase 3)

1. **Add `sync_runs` table** — `(source, run_at, fetched, inserted, errors, duration_ms)`. Write at end of `syncAllSources()`. Makes pipeline observable without digging through Railway logs. *(20 min)*

2. **Denormalize `city` onto `events`** — pull city from resolved venue at upsert time, filter `GET /api/events` directly on `events.city`. Fixes silent join bug. *(30 min)*

3. **Add JWT auth to `POST /api/events/submit`** — currently wide open, no auth, no rate limit. Any bot can flood `events` with unverified rows. *(1 hour)*

---

## Frontend Quick Wins (Before Phase 3 Launch)

1. **Persist likes to `localStorage`** — two lines in `handleLike`/`handleNotify` + `useState` initializer reading from storage. Fixes biggest perceived UX bug before auth ships.

2. **Replace hardcoded hero stats** — "847 shows this month" is fiction. `allEvents.length` and `catCounts` are already computed — thread them into the hero copy.

3. **Add empty state to event feed** — when `filteredEvents.length === 0`, render a message ("No events found for this day" vs "Events loading — check back soon" based on `isLoading`). Currently the feed collapses silently.

4. **Fix `$undefined–$undefined` price display** — price range template runs even when `priceMin`/`priceMax` are null.

---

## Database Schema Additions by Phase

```sql
-- Phase 3
ALTER TABLE profiles ADD COLUMN notification_preferences JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE saved_events ADD UNIQUE (user_id, event_id);
ALTER TABLE saved_events ADD COLUMN event_type TEXT DEFAULT 'saved'; -- 'saved' | 'going'

-- Phase 4
ALTER TABLE events ADD COLUMN submitted_by UUID REFERENCES profiles(id);
ALTER TABLE events ADD COLUMN submission_notes TEXT;

-- Any phase (analytics foundation)
CREATE TABLE event_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  user_id UUID REFERENCES profiles(id), -- nullable for anonymous
  viewed_at TIMESTAMPTZ DEFAULT now(),
  source TEXT -- 'calendar' | 'feed' | 'search'
);

-- Phase 6 (prep before building)
ALTER TABLE events ADD COLUMN ai_tags TEXT[];
ALTER TABLE events ADD COLUMN embedding VECTOR(1536); -- requires pgvector extension
ALTER TABLE profiles ADD COLUMN user_preferences JSONB DEFAULT '{}';

-- Infra
CREATE TABLE sync_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT,
  run_at TIMESTAMPTZ DEFAULT now(),
  fetched INT,
  inserted INT,
  errors INT,
  duration_ms INT
);
```

---

## New API Endpoints Needed

```
POST   /api/auth/profile          # create/update profile after signup
GET    /api/users/:id/saved        # list saved events
POST   /api/users/:id/saved        # save an event
DELETE /api/users/:id/saved/:eid   # unsave
POST   /api/events/:id/view        # record a view (unauthenticated OK)
GET    /api/discover               # Phase 6: AI-ranked feed
```

Also: add `?search=` free-text param to `GET /api/events` before Phase 6.

---

## Roadmap at a Glance

| Phase | Status | Gate to Advance |
|-------|--------|-----------------|
| 1 — Foundation | ✅ Done | — |
| 2 — Real APIs | 🔴 Deploy broken | Railway config fix → events in Supabase → calendar populated |
| 3 — User Accounts | ⬜ Next | Auth working → saves persist → 10 users with saved events |
| 4 — User Submissions | ⬜ | 25+ real users, Phase 3 stable, moderation plan exists |
| 5 — Map View | ⬜ | lat/lng data quality acceptable, Mapbox token ready |
| 6 — Discovery Engine | ⬜ | 3+ months of save/view behavioral data, pgvector enabled |
| 7 — Mobile/PWA | ⬜ | PWA manifest first; push notifications only after 1k MAU |
| 8 — Monetization | ⬜ | Established user base, venue relationships initiated |
