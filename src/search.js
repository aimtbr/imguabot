import { getImagesDuckDuckGo } from './engines/duckduckgo.js';
import { getImagesGoogle } from './engines/google.js';

const SEARCH_ENGINE = Deno.env.get('SEARCH_ENGINE') || 'duckduckgo';

// Successful results are cached as long as Telegram caches the answer itself.
const CACHE_TTL_MS = Number(Deno.env.get('SEARCH_CACHE_TTL_MS') || 300_000);
// Empty results are cached too, so a blocked or rate-limited engine is not
// hammered once per query while it is refusing to answer.
const EMPTY_CACHE_TTL_MS = Number(
  Deno.env.get('SEARCH_EMPTY_CACHE_TTL_MS') || 60_000,
);
const CACHE_MAX_ENTRIES = Number(
  Deno.env.get('SEARCH_CACHE_MAX_ENTRIES') || 500,
);

const cache = new Map();
const inFlight = new Map();

// ============================================
// Result Cache
// ============================================

function cacheKey(query, pageOffset) {
  return `${SEARCH_ENGINE}:${pageOffset}:${query.toLowerCase()}`;
}

function readCache(key) {
  const entry = cache.get(key);

  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

function writeCache(key, value) {
  const now = Date.now();

  // Drop expired entries before deciding whether the cache is full
  for (const [entryKey, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(entryKey);
  }

  // Map preserves insertion order, so the first keys are the oldest ones
  while (cache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;

    if (oldestKey === undefined) break;

    cache.delete(oldestKey);
  }

  const isEmpty = value.results.length === 0;
  const ttl = isEmpty ? EMPTY_CACHE_TTL_MS : CACHE_TTL_MS;

  cache.set(key, { value, expiresAt: now + ttl });
}

// ============================================
// Main Search Function
// ============================================

async function fetchImages(query, pageOffset) {
  try {
    if (SEARCH_ENGINE === 'google') {
      return await getImagesGoogle(query);
    }

    if (SEARCH_ENGINE === 'duckduckgo') {
      return await getImagesDuckDuckGo(query, pageOffset);
    }

    return { source: 'none', results: [] };
  } catch (error) {
    console.error('Search error:', error);

    return { source: 'none', results: [] };
  }
}

export async function searchImages(query, pageOffset = 0) {
  const key = cacheKey(query, pageOffset);

  const cached = readCache(key);
  if (cached) {
    return { ...cached, cached: true };
  }

  // The same query may already be on its way upstream - wait for that one
  // instead of sending a second identical request
  const pending = inFlight.get(key);
  if (pending) {
    return { ...(await pending), cached: true };
  }

  const request = fetchImages(query, pageOffset)
    .then((value) => {
      writeCache(key, value);

      return value;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, request);

  return { ...(await request), cached: false };
}
