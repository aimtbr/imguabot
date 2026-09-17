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

// Telegram caches inline answers itself, in seconds. A refusal gets a short
// window so one bad answer is not served to everyone searching that term.
export const ANSWER_CACHE_TIME = number('ANSWER_CACHE_TIME', 300);
export const ANSWER_EMPTY_CACHE_TIME = number('ANSWER_EMPTY_CACHE_TIME', 60);
export const ANSWER_FAILURE_CACHE_TIME = number('ANSWER_FAILURE_CACHE_TIME', 5);

// Google Custom Search - no defaults, the engine skips itself when unset
export const GOOGLE_API_KEY = text('GOOGLE_API_KEY');
export const GOOGLE_SEARCH_ENGINE_ID = text('GOOGLE_SEARCH_ENGINE_ID');
