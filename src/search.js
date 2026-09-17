import { getImagesDuckDuckGo } from './engines/duckduckgo.js';
import { getImagesGoogle } from './engines/google.js';
import {
  SEARCH_ENGINE,
  SEARCH_CACHE_TTL_MS as CACHE_TTL_MS,
  SEARCH_EMPTY_CACHE_TTL_MS as EMPTY_CACHE_TTL_MS,
  SEARCH_FAILURE_CACHE_TTL_MS as FAILURE_CACHE_TTL_MS,
  SEARCH_CACHE_MAX_ENTRIES as CACHE_MAX_ENTRIES,
  SEARCH_BREAKER_THRESHOLD as BREAKER_THRESHOLD,
  SEARCH_BREAKER_COOLDOWN_MS as BREAKER_COOLDOWN_MS,
  SEARCH_BREAKER_MAX_COOLDOWN_MS as BREAKER_MAX_COOLDOWN_MS,
} from './config.js';

const cache = new Map();
const inFlight = new Map();

let consecutiveFailures = 0;
let pausedUntil = 0;

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

  // A failure is held only as a stampede guard; a genuine "no results" is a
  // stable answer and keeps the longer empty TTL
  let ttl = CACHE_TTL_MS;
  if (value.failed) ttl = FAILURE_CACHE_TTL_MS;
  else if (value.results.length === 0) ttl = EMPTY_CACHE_TTL_MS;

  cache.set(key, { value, expiresAt: now + ttl });
}

// ============================================
// Circuit Breaker
// ============================================

// Retrying helps when an engine refuses sporadically. When it refuses every
// time, retrying just adds load to an address that is already being blocked,
// so past a threshold requests stop until the engine has had time to relent.
function isPaused() {
  return Date.now() < pausedUntil;
}

function recordOutcome(failed) {
  if (!failed) {
    if (consecutiveFailures > 0) {
      console.log(
        `Search engine answered again after ${consecutiveFailures} refusals`,
      );
    }

    consecutiveFailures = 0;
    pausedUntil = 0;

    return;
  }

  consecutiveFailures++;

  if (consecutiveFailures < BREAKER_THRESHOLD) return;

  // Every refusal past the threshold doubles the wait, up to the ceiling
  const cooldown = Math.min(
    BREAKER_COOLDOWN_MS * 2 ** (consecutiveFailures - BREAKER_THRESHOLD),
    BREAKER_MAX_COOLDOWN_MS,
  );

  pausedUntil = Date.now() + cooldown;

  console.warn(
    `Search engine refused ${consecutiveFailures} times in a row, pausing requests for ${Math.round(cooldown / 1000)}s`,
  );
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

  if (isPaused()) {
    // A cached answer is still worth serving while requests are paused
    const paused = readCache(key);

    return paused
      ? { ...paused, cached: true }
      : { source: SEARCH_ENGINE, results: [], failed: true, cached: false };
  }

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
      recordOutcome(value.failed);
      writeCache(key, value);

      return value;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, request);

  return { ...(await request), cached: false };
}
