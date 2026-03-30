# OnTonight — UI Audit
**Date:** 2026-03-30
**Agents:** UI Designer · UX Researcher · Whimsy Injector
**Taste Skill baseline:** DESIGN_VARIANCE: 8 · MOTION_INTENSITY: 6 · VISUAL_DENSITY: 4

---

## 1. CONFIRMED BUGS (fix first, before any design work)

| Bug | Symptom | Likely Cause |
|-----|---------|--------------|
| **Modals don't open** | Clicking an event card does nothing | `onClick` on EventCard fires but no modal state is wired up in the main component |
| **Buy links broken** | BUY button goes nowhere | `ticket_url` from Ticketmaster is null for many events — need fallback or hide button when null |
| **Calendar dates same color** | No density gradient visible | `getDensityStyle` is correct but calendar cell background may not be applying the `bg` value |
| **"Events this month" → "Events on [day]"** | Header text swaps when date selected | Intentional but confusing — label should stay "Events" and show the date as a subtitle, not replace the heading |

---

## 2. UX RESEARCHER — Friction Findings

### Critical Flow Breaks
- **No modal = no conversion path.** User sees an event they like, clicks it, nothing happens. Dead end. This is the single highest-priority fix.
- **Buy link is the only monetization hook** and it silently fails. Users have no idea if the link is broken or if there are no tickets.
- **Calendar has no "today" indicator.** Users open the app and have no anchor for where they are in the month.
- **No empty state when a date has 0 events.** Clicking a date with nothing on it produces a blank list with no message.

### Discovery Friction
- **No location/distance filter.** GTA is huge. A user in Mississauga doesn't want to see Scarborough shows they can't get to. This is a table-stakes filter for a local events app.
- **No API source filter.** Power users want to know if an event is from Ticketmaster vs. a user submission. Showing the source breakdown also builds trust ("we pull from 4 live sources").
- **Category filter chips exist but no source filter.** Inconsistent — finish the filter surface.

### Persona insight
Primary user: "I want to know what's happening near me tonight, pick something, and buy a ticket in under 60 seconds." Current flow breaks at step 3 (modal) and step 4 (buy link). The calendar-first layout is correct for browsing but the card→modal→ticket path needs to actually work.

---

## 3. UI DESIGNER — Visual System Issues

### Typography
- **Playfair Display on the hero is correct.** Keep it. Editorial, warm, on-brand.
- **Event cards use no type hierarchy.** Title, venue, time, and category are all fighting at 11–13px. The title needs to lead at 14–15px bold, venue and time recede to 11px mid-tone.
- **"Events this month" / "Events on [day]" heading** should be Playfair to match the editorial tone, not Inter.

### Color
- **Calendar density is broken visually** — all dates look identical. The warm gradient from `#8C8070` (1–2 events) → `#D48B2D` (3–5) → `#C0392B` (10+) is the right system, just not rendering. Fixing the bug will fix the visual.
- **Selected date state** needs a stronger indicator: filled background `#1A1714` with white text, not just a ring.
- **Today's date** should have a subtle `#C0392B` underline or dot — standard calendar convention.

### Event Cards
- **Left color bar is good.** Keep the `borderLeft: 4px solid catColor` — it's doing real work for scannability.
- **Emoji icons in cards** (🕐 📍 ❤️ 🔔) should be replaced with proper SVG icons per taste-skill ANTI-EMOJI POLICY. Use `@phosphor-icons/react`: `Clock`, `MapPin`, `Heart`, `Bell`.
- **BUY button** is too small and too aggressive red for a card context. Should be a ghost/outline button that becomes solid on hover, or a ticket icon link.

### Modal (to be built)
- **Full-bleed event image at top** — Ticketmaster returns image URLs, use them. `objectFit: cover`, 16:9 or 3:2 ratio.
- **Morphing modal pattern** from taste-skill arsenal: the card expands into the modal using `layoutId` (Framer Motion shared element transition). Feels premium, zero flash.
- **Modal content:** image → title → date/time/venue → price range → description → BUY CTA (large, full-width, ink background).
- **Fallback image:** if `image_url` is null, use a warm paper-toned gradient with the category color and venue name typeset large. Never show a broken image.

### Source Panel (to be built)
- **Stats strip** below the hero already exists (`STATS STRIP` in code). Extend it or replace it with a live "Pulling from X sources · Y events tonight" bar.
- **Source filter chips** should sit alongside the category filter chips, visually distinct (outlined vs. filled).

---

## 4. WHIMSY INJECTOR — Delight Opportunities

OnTonight's brand voice is "the well-read friend who knows every venue." The UI should feel like that person — knowledgeable, a little fun, never anxious.

### Empty States (currently missing entirely)
- **No events on this date:** "Nothing on [date] — try the night before or after. Toronto doesn't take many nights off."
- **No results for filter combo:** "No [category] events found this month. Try removing a filter."
- **Loading state:** instead of generic skeleton, the calendar skeleton cells should pulse with a warm amber shimmer (matching `#D48B2D`) — feels alive, on-brand.

### Modal delight
- **Ticket button copy:** "Get tickets →" not "BUY". Less transactional.
- **Like confirmation:** when a user likes an event, the heart button should do a small spring-bounce scale animation (scale 1 → 1.4 → 1). Framer Motion, isolated component.
- **"Added to your night"** micro-toast on like — appears at bottom for 2 seconds, fades. Copy: "Saved to your night."

### Calendar
- **Today's date** should have a subtle warm pulse on first load — draws the eye to now without being annoying. One pulse, not infinite.
- **Hover on date cells** with events: show a small tooltip with event count — "4 events". Quick, informative, satisfying.

### Source transparency (trust-building whimsy)
- Small animated "live" dot next to "Ticketmaster" in the source badge when data is fresh (< 6hrs since last sync). Subtle green pulse. Signals the data is real and current.

---

## 5. LOCATION FILTER — Feature Spec

This is a new feature, not a bug fix. Scope for next sprint.

**User flow:**
1. "Set your area" button in the filter bar (or nav)
2. Dropdown/modal: enter a Toronto neighbourhood, intersection, or postal code — OR use browser geolocation
3. Set a radius: 5km / 10km / 25km / anywhere in GTA
4. Filter persists in localStorage — don't ask every session

**Data requirement:** `venues` table already has `latitude` / `longitude` columns. Ticketmaster sync populates these. Distance calc can happen client-side with a simple haversine function — no backend change needed.

**UI:** Filter chip in the filter bar: "📍 Within 10km of Kensington Market ×" — tappable to change, × to clear.

---

## 6. API SOURCE PANEL — Feature Spec

**Where:** Replace or extend the existing STATS STRIP section between hero and app.

**Content:**
```
Pulling from 1 source · 1,200 events this month · Last synced 2h ago
[Ticketmaster ●] [Eventbrite ○] [Songkick ○] [Bandsintown ○]
```
- Filled dot = active/connected. Empty = coming soon.
- Clicking an active source toggles it as a filter.
- "Last synced" pulls from a `/api/health` or new `/api/sync-status` endpoint.

**Backend needed:** Add `GET /api/sync-status` returning `{ lastSync: ISO timestamp, sources: { ticketmaster: { count: N, lastSync: ISO } } }`.

---

## 7. IMPLEMENTATION PRIORITY

### P0 — Bugs (do now)
1. Wire modal open on EventCard click
2. Fix calendar density colors rendering
3. Hide BUY button when `ticket_url` is null
4. Fix "Events this month" label not resetting

### P1 — Core UX (next session)
5. Build event modal with image, full details, ticket CTA
6. Add today indicator + empty state for dates with no events
7. Replace emoji icons in cards with Phosphor icons

### P2 — Features (sprint after)
8. Location/distance filter (client-side haversine, localStorage)
9. API source panel + source filter chips
10. Like animation + "Saved to your night" toast

### P3 — Polish
11. Morphing card→modal transition (Framer Motion `layoutId`)
12. Staggered card load-in animation
13. Calendar hover tooltips

---

## 8. TECH NOTES

- **Framer Motion** is not in `package.json` — needed for P1 modal and P3 animations. `npm install framer-motion` when ready.
- **Phosphor Icons**: `npm install @phosphor-icons/react` for P1 icon replacement.
- **Haversine** for location filter: no package needed, ~10 lines of JS.
- **Taste-skill compliance check:**
  - DESIGN_VARIANCE 8: hero is asymmetric ✅, app section needs asymmetric grid work
  - MOTION_INTENSITY 6: currently 0 — need at minimum card hover transitions and modal animation
  - VISUAL_DENSITY 4: good, don't add more data density to cards
