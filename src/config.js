// ============================================
// Environment Configuration
// ============================================
//
// Every environment variable the bot reads is resolved here, so the defaults
// live in one place instead of being spread across the modules that use them.

function text(name) {
  return Deno.env.get(name);
}

function number(name, fallback) {
  const value = Number(Deno.env.get(name));

  // Missing or non-numeric values fall back to the default instead of
  // poisoning the rest of the app with NaN
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

// Telegram
export const BOT_TOKEN = text('BOT_TOKEN');
export const BOT_TITLE = text('BOT_TITLE');
export const BOT_USERNAME = text('BOT_USERNAME');
export const MY_USERNAME = text('MY_USERNAME');
export const WEBHOOK_SECRET = text('WEBHOOK_SECRET');

// Inline results
export const MAX_IMAGE_TITLE_LENGTH = number('MAX_IMAGE_TITLE_LENGTH', 64);
export const MAX_IMAGES = number('MAX_IMAGES', 500);
export const MAX_IMAGES_PER_PAGE = number('MAX_IMAGES_PER_PAGE', 50);
export const MIN_QUERY_LENGTH = number('MIN_QUERY_LENGTH', 2);

// Telegram sends an inline query on every keystroke - how long to wait for the
// user to stop typing before searching
export const INLINE_QUERY_DEBOUNCE_MS = number('INLINE_QUERY_DEBOUNCE_MS', 300);

// Search
export const SEARCH_ENGINE = text('SEARCH_ENGINE') || 'duckduckgo';

// Successful results are cached as long as Telegram caches the answer itself
export const SEARCH_CACHE_TTL_MS = number('SEARCH_CACHE_TTL_MS', 300_000);
// Empty results are cached too, so a blocked or rate-limited engine is not
// hammered once per query while it is refusing to answer
export const SEARCH_EMPTY_CACHE_TTL_MS = number(
  'SEARCH_EMPTY_CACHE_TTL_MS',
  60_000,
);
// A failed search is not an answer, so it is only held long enough to stop a
// stampede of identical retries while the engine is refusing
export const SEARCH_FAILURE_CACHE_TTL_MS = number(
  'SEARCH_FAILURE_CACHE_TTL_MS',
  5_000,
);
export const SEARCH_CACHE_MAX_ENTRIES = number('SEARCH_CACHE_MAX_ENTRIES', 500);

// How many times an engine may try before a search counts as failed, and how
// long to wait in between so the retry is not part of the same burst
export const SEARCH_RETRY_ATTEMPTS = number('SEARCH_RETRY_ATTEMPTS', 2);
export const SEARCH_RETRY_DELAY_MS = number('SEARCH_RETRY_DELAY_MS', 500);

// Telegram caches inline answers itself, in seconds. Deriving those from the
// TTLs above keeps the two layers from drifting apart: Telegram holds an
// answer for as long as we consider it good.
export const SEARCH_CACHE_TTL_SECONDS = Math.round(SEARCH_CACHE_TTL_MS / 1000);
export const SEARCH_EMPTY_CACHE_TTL_SECONDS = Math.round(
  SEARCH_EMPTY_CACHE_TTL_MS / 1000,
);
export const SEARCH_FAILURE_CACHE_TTL_SECONDS = Math.round(
  SEARCH_FAILURE_CACHE_TTL_MS / 1000,
);

// Google Custom Search - no defaults, the engine skips itself when unset
export const GOOGLE_API_KEY = text('GOOGLE_API_KEY');
export const GOOGLE_SEARCH_ENGINE_ID = text('GOOGLE_SEARCH_ENGINE_ID');
