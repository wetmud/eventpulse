# OnTonight — Brand Identity Spec

**Tagline:** Everything happening tonight.
**Date:** 2026-03-23
**Status:** Approved by founder

---

## Brand Foundation

**Purpose:** Make sure no one misses what's happening in their city.

**Vision:** The definitive city events layer — for any city, every night.

**Mission:** Surface everything happening tonight, automatically, beautifully. No submissions, no noise, no gaps.

**Values:**
- Completeness — if it's happening, it's here
- Trust — accurate, auto-populated, not user-dependent
- Locality — feels native to your city, whoever you are

**Personality:** The well-read friend who knows every venue, reads every listing, and actually goes to things. Not anxious — just plugged in.

---

## Positioning

**Primary audience:** People who feel like they always miss things and want to stop.

**Secondary audience:** Culture obsessives who want the full picture, not just what's trending.

**Competitive differentiation:** Unlike AllEvents, Eventbrite, or Bandsintown — OnTonight pulls automatically from real APIs. No submissions required. Calendar-first UX. Warm, trustworthy aesthetic vs. dark/neon event app defaults.

**Positioning statement:** OnTonight is the city events app that shows you everything happening tonight — automatically, completely, without the noise.

---

## Visual Identity

### Mood
Record store shelf meets newspaper listings. Analog warmth, typographic confidence. Feels like something a culture-obsessed local would trust. Event imagery carries the color — the interface itself stays calm and warm.

### Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Paper | `#F5F0E8` | Primary background |
| Ink | `#1A1714` | Primary text |
| Warm White | `#FAF8F4` | Card backgrounds |
| Muted Red | `#C0392B` | Primary accent, CTAs |
| Amber | `#D48B2D` | Secondary accent, highlights |
| Mid Tone | `#8C8070` | Secondary text, dividers |
| Deep Warm | `#2C2420` | Dark surfaces, footer |

### Typography Direction

- **Display / Headlines:** Serif — something with editorial weight. Think Playfair Display, Freight Display, or similar. Evokes newspaper mastheads.
- **Body / UI:** Clean sans-serif — Inter, DM Sans, or similar. Readable, neutral, gets out of the way.
- **Accent / Labels:** Condensed or mono for event metadata (dates, times, venues). Functional, slightly industrial.

### Logo Concept Notes

- Wordmark-first approach — `OnTonight` set in display serif, potentially with a subtle typographic treatment on the "On" prefix
- Secondary icon: could be a simple dot or filled circle representing "live / happening now"
- Works in: Ink on Paper (primary), White on Deep Warm (reversed), Muted Red on Paper (accent)
- Avoid: anything that looks like a music app icon (no soundwaves, no headphones)

---

## Brand Voice

**Characteristics:**
- Knowledgeable but not elitist
- Warm but not precious
- Complete but not overwhelming
- Local but not parochial

**Tone:**
- In the app: clear, confident, informative. "47 events tonight." Not "Wow, so much happening!"
- In marketing: understated. Let the comprehensiveness speak.
- In empty states: reassuring. "Nothing tonight in this category — try expanding your search."

**Vocabulary:**
- Use: tonight, happening, on, city, everything, full picture
- Avoid: discover (overused), experience (vague), amazing, curated (ironic given auto-pull)

**Tagline:** Everything happening tonight.

---

## Technical Migration Notes

### Rename Scope (EventPulse → OnTonight)

**Repository:**
- Rename GitHub repo: `eventpulse` → `ontonight`
- Update `package.json` name fields in root and `/server`
- Update `README.md`

**Frontend (Vercel):**
- Update `<title>` and meta tags in `index.html`
- Update any hardcoded "EventPulse" strings in `src/`
- New Vercel project name / custom domain when ready: `ontonight.app` or `ontonight.com`
- Update `VITE_API_URL` if backend URL changes

**Backend (Railway):**
- Update Railway project name
- No structural changes needed — API routes stay the same
- Update `FRONTEND_URL` env var when new domain is set

**Supabase:**
- Display name only — no schema changes needed
- Update project name in dashboard for clarity

**CLAUDE.md / Docs:**
- Update all references from EventPulse → OnTonight
- Update roadmap file name and internal references

### Domain
- Target: `ontonight.app` (appears unregistered) or negotiate `ontonight.com` (parked, "coming soon")
- Register before going public with the name

### What Doesn't Change
- All API integrations (Ticketmaster etc.)
- Supabase schema
- Railway infrastructure
- Vercel deployment pipeline
- Phase roadmap structure

---

## Next Steps

1. Register `ontonight.app` domain
2. Execute rename (repo, package.json, meta tags, CLAUDE.md)
3. Design phase: apply color palette + typography to existing UI
4. Update README and roadmap with new name
