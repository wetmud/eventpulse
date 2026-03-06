/**
 * Ticketmaster Discovery API service
 * Fetches and normalizes GTA events into our schema
 */

const BASE_URL = 'https://app.ticketmaster.com/discovery/v2/events.json';
const API_KEY = process.env.TICKETMASTER_API_KEY;

const CATEGORY_MAP = {
  'Music': 'Concerts',
  'Sports': 'Sports',
  'Arts & Theatre': 'Theatre',
  'Film': 'Other',
  'Miscellaneous': 'Other',
  'Comedy': 'Comedy',
  'Family': 'Festivals',
};

/**
 * Sleep helper for rate limiting backoff
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch one page of events from Ticketmaster with retry/backoff
 */
async function fetchPage(page = 0, retries = 3) {
  const url = new URL(BASE_URL);
  url.searchParams.set('apikey', API_KEY);
  url.searchParams.set('city', 'Toronto');
  url.searchParams.set('countryCode', 'CA');
  url.searchParams.set('radius', '80');
  url.searchParams.set('unit', 'km');
  url.searchParams.set('size', '200');
  url.searchParams.set('page', page);
  url.searchParams.set('sort', 'date,asc');

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url.toString());

      if (res.status === 429) {
        const wait = Math.pow(2, attempt) * 1000;
        console.log(`Ticketmaster rate limited. Waiting ${wait}ms...`);
        await sleep(wait);
        continue;
      }

      if (!res.ok) {
        throw new Error(`Ticketmaster API error: ${res.status} ${res.statusText}`);
      }

      return await res.json();
    } catch (err) {
      if (attempt === retries - 1) throw err;
      await sleep(Math.pow(2, attempt) * 500);
    }
  }
}

/**
 * Normalize a raw Ticketmaster event into our schema shape
 */
function normalizeEvent(raw) {
  try {
    const venue = raw._embedded?.venues?.[0];
    const segment = raw.classifications?.[0]?.segment?.name;
    const genre = raw.classifications?.[0]?.genre?.name;

    const priceRange = raw.priceRanges?.[0];
    const image = raw.images?.find(i => i.ratio === '16_9' && i.width > 500)
      || raw.images?.[0];

    // Parse date/time
    const dateObj = raw.dates?.start;
    const eventDate = dateObj?.localDate || null;
    const startTime = dateObj?.localTime || null;

    if (!eventDate) return null; // skip events with no date

    return {
      source: 'ticketmaster',
      source_id: raw.id,
      title: raw.name,
      description: raw.info || raw.pleaseNote || null,
      category: CATEGORY_MAP[segment] || 'Other',
      subcategory: genre || null,
      event_date: eventDate,
      start_time: startTime,
      price_min: priceRange?.min ?? null,
      price_max: priceRange?.max ?? null,
      currency: priceRange?.currency || 'CAD',
      ticket_url: raw.url || null,
      image_url: image?.url || null,
      popularity_score: raw.score ? Math.round(raw.score * 100) : 0,
      is_verified: true,
      // Venue data (normalized separately)
      _venue: venue ? {
        name: venue.name,
        address: venue.address?.line1 || null,
        city: venue.city?.name || 'Toronto',
        region: venue.state?.stateCode || 'ON',
        country: venue.country?.countryCode || 'CA',
        latitude: venue.location?.latitude ? parseFloat(venue.location.latitude) : null,
        longitude: venue.location?.longitude ? parseFloat(venue.location.longitude) : null,
        website: venue.url || null,
      } : null,
    };
  } catch (err) {
    console.error('Failed to normalize Ticketmaster event:', raw.id, err.message);
    return null;
  }
}

/**
 * Fetch all pages of GTA events from Ticketmaster
 * Returns array of normalized events
 */
export async function fetchTicketmasterEvents() {
  if (!API_KEY) {
    console.warn('TICKETMASTER_API_KEY not set — skipping Ticketmaster sync');
    return [];
  }

  console.log('Fetching Ticketmaster events for GTA...');

  const allEvents = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    try {
      const data = await fetchPage(page);

      const events = data?._embedded?.events || [];
      totalPages = data?.page?.totalPages || 1;

      console.log(`  Page ${page + 1}/${totalPages}: ${events.length} events`);

      for (const raw of events) {
        const normalized = normalizeEvent(raw);
        if (normalized) allEvents.push(normalized);
      }

      page++;

      // Respect rate limits — Ticketmaster allows 5 req/sec on free tier
      if (page < totalPages) await sleep(250);

    } catch (err) {
      console.error(`Ticketmaster page ${page} failed:`, err.message);
      break;
    }
  }

  console.log(`Ticketmaster: fetched ${allEvents.length} valid events`);
  return allEvents;
}
