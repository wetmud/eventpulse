/**
 * Sync service — orchestrates all API sources and upserts into Supabase
 *
 * Flow per event:
 *   1. Upsert venue (by name + city) → get venue UUID
 *   2. Upsert event (by source + source_id) with venue_id attached
 */

import { supabase } from '../index.js';
import { fetchTicketmasterEvents } from './ticketmaster.js';

/**
 * Upsert a venue and return its UUID.
 * Matches on name + city to avoid duplicates.
 */
async function upsertVenue(venueData) {
  if (!venueData) return null;

  try {
    // Try to find existing venue first
    const { data: existing } = await supabase
      .from('venues')
      .select('id')
      .eq('name', venueData.name)
      .eq('city', venueData.city)
      .maybeSingle();

    if (existing) return existing.id;

    // Insert new venue
    const { data, error } = await supabase
      .from('venues')
      .insert([venueData])
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (err) {
    console.error('upsertVenue error:', err.message, venueData.name);
    return null;
  }
}

/**
 * Upsert a batch of normalized events into Supabase.
 * Uses ON CONFLICT (source, source_id) to update existing records.
 */
async function upsertEvents(events) {
  if (!events.length) return { inserted: 0, updated: 0, errors: 0 };

  let inserted = 0;
  let errors = 0;

  // Process in batches of 50 to avoid payload limits
  const BATCH_SIZE = 50;

  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE);

    // First: resolve venue IDs for this batch
    const eventsWithVenueIds = await Promise.all(
      batch.map(async (event) => {
        const { _venue, ...eventData } = event;
        const venueId = await upsertVenue(_venue);
        return { ...eventData, venue_id: venueId };
      })
    );

    // Then: upsert events
    const { error, count } = await supabase
      .from('events')
      .upsert(eventsWithVenueIds, {
        onConflict: 'source,source_id',
        ignoreDuplicates: false, // update existing records
        count: 'exact',
      });

    if (error) {
      console.error(`Batch upsert error (batch ${i / BATCH_SIZE + 1}):`, error.message);
      errors += batch.length;
    } else {
      inserted += count || batch.length;
    }
  }

  return { inserted, errors };
}

/**
 * Main sync function — runs all sources and reports results
 */
export async function syncAllSources() {
  console.log('=== OnTonight Sync Started ===', new Date().toISOString());

  const results = {
    ticketmaster: { fetched: 0, inserted: 0, errors: 0 },
  };

  // ── Ticketmaster ─────────────────────────────────────────────────────────
  try {
    const events = await fetchTicketmasterEvents();
    results.ticketmaster.fetched = events.length;

    if (events.length > 0) {
      const { inserted, errors } = await upsertEvents(events);
      results.ticketmaster.inserted = inserted;
      results.ticketmaster.errors = errors;
    }
  } catch (err) {
    console.error('Ticketmaster sync failed:', err.message);
    results.ticketmaster.errors = -1;
  }

  console.log('=== Sync Complete ===', JSON.stringify(results));
  return results;
}
