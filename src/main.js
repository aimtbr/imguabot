const { handleStartCommand } = require('./commands/start.js');
const { handleHelpCommandEN } = require('./commands/en/help.js');
const { handleHelpCommandUK } = require('./commands/uk/help.js');
const { handleAboutCommandEN } = require('./commands/en/about.js');
const { handleAboutCommandUK } = require('./commands/uk/about.js');
const { getImagesDuckDuckGo } = require('./engines/duckduckgo.js');
const { getImagesGoogle } = require('./engines/google.js');

const BOT_TOKEN = Deno.env.get('BOT_TOKEN');
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET');
const SEARCH_ENGINE = Deno.env.get('SEARCH_ENGINE') || 'duckduckgo';

const BOT_TITLE = Deno.env.get('BOT_TITLE');

const MAX_TITLE_LENGTH = Deno.env.get('MAX_TITLE_LENGTH') || 64;
const MAX_IMAGES = Deno.env.get('MAX_IMAGES') || 50;
const MIN_QUERY_LENGTH = Deno.env.get('MIN_QUERY_LENGTH') || 3;

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ============================================
// Telegram API Helper
// ============================================

async function telegram(method, body = {}) {
  const response = await fetch(`${TELEGRAM_API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.json();
}

// ============================================
// Main Search Function (tries DuckDuckGo first)
// ============================================

async function searchImages(query) {
  try {
    if (SEARCH_ENGINE === 'google') {
      return getImagesGoogle(query);
    }

    if (SEARCH_ENGINE === 'duckduckgo') {
      return getImagesDuckDuckGo(query);
    }
  } catch (error) {
    console.error('Search error:', error);

    return { source: 'none', results: [] };
  }
}

// ============================================
// Inline Query Handler
// ============================================

async function handleInlineQuery(inlineQuery) {
  const { id, query } = inlineQuery;

  const queryPrepared = query && query.trim();
  // Empty query - show hint
  if (!queryPrepared || queryPrepared.length < MIN_QUERY_LENGTH) {
    return telegram('answerInlineQuery', {
      inline_query_id: id,
      results: [],
      cache_time: 0,
      switch_pm_text: `🔍 Type ${MIN_QUERY_LENGTH}+ characters to search images...`,
      switch_pm_parameter: 'help',
    });
  }

  // Search images
  const { source, results: images } = await searchImages(queryPrepared);

  const noImagesFound = images.length === 0;
  if (noImagesFound) {
    return telegram('answerInlineQuery', {
      inline_query_id: id,
      results: [],
      cache_time: 60,
      switch_pm_text: '😕 No images found. Try different keywords.',
      switch_pm_parameter: 'help',
    });
  }

  // Build inline results
  const results = images
    .filter((item) => item && item.image && item.thumbnail)
    .slice(0, MAX_IMAGES)
    .map((item, index) => ({
      type: 'photo',
      id: `${Date.now()}-${index}`,
      photo_url: item.image,
      thumbnail_url: item.thumbnail,
      photo_width: item.width,
      photo_height: item.height,
      title: item.title.slice(0, MAX_TITLE_LENGTH),
    }));

  await telegram('answerInlineQuery', {
    inline_query_id: id,
    results,
    cache_time: 300, // Cache for 5 minutes
    is_personal: false,
  });

  console.log(`Search: "${query}" → ${results.length} results (${source})`);
}

// ============================================
// Bot Commands Handler
// ============================================

async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = message.text || '';

  // /start command
  if (text.startsWith('/start')) {
    return handleStartCommand(telegram, chatId);
  }

  // /help command
  if (text === '/help') {
    return handleHelpCommandEN(telegram, chatId);
  }

  // /допомога command
  if (text === '/допомога') {
    return handleHelpCommandUK(telegram, chatId);
  }

  // /about command
  if (text === '/about') {
    return handleAboutCommandEN(telegram, chatId);
  }

  // /опис command
  if (text === '/опис') {
    return handleAboutCommandUK(telegram, chatId);
  }

  // Unknown message - show hint
  await telegram('sendMessage', {
    chat_id: chatId,
    text: `Use /help to learn how to search images!

Використовуйте /допомога, щоб дізнатися, як шукати зображення!
`,
  });
}

// ============================================
// Main Update Router
// ============================================

async function handleUpdate(update) {
  try {
    if (update.inline_query) {
      await handleInlineQuery(update.inline_query);
    } else if (update.message) {
      await handleMessage(update.message);
    }
  } catch (error) {
    console.error('Error handling update:', error);
  }
}

// ============================================
// Deno Deploy HTTP Server
// ============================================

Deno.serve(async (request) => {
  const url = new URL(request.url);

  // Health check
  if (url.pathname === '/' || url.pathname === '/health') {
    return new Response(`🤖 ${BOT_TITLE} is running!`, { status: 200 });
  }

  // Webhook endpoint
  if (url.pathname === '/webhook' && request.method === 'POST') {
    // Verify secret token
    const secretHeader = request.headers.get('x-telegram-bot-api-secret-token');
    if (secretHeader !== WEBHOOK_SECRET) {
      console.warn('Unauthorized webhook request');
      return new Response('Unauthorized', { status: 401 });
    }

    try {
      const update = await request.json();

      // Handle asynchronously (don't block response)
      handleUpdate(update);

      return new Response('OK', { status: 200 });
    } catch (error) {
      console.error('Webhook parse error:', error);
      return new Response('Bad Request', { status: 400 });
    }
  }

  // Setup webhook (visit once after deploy)
  if (url.pathname === '/setup') {
    const webhookUrl = `${url.origin}/webhook`;

    const result = await telegram('setWebhook', {
      url: webhookUrl,
      secret_token: WEBHOOK_SECRET,
      allowed_updates: ['message', 'inline_query'],
      drop_pending_updates: true,
    });

    const info = await telegram('getWebhookInfo');

    return new Response(
      JSON.stringify({ setup: result, info: info }, null, 2),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  // Delete webhook (for debugging)
  if (url.pathname === '/delete-webhook') {
    const result = await telegram('deleteWebhook', {
      drop_pending_updates: true,
    });
    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('Not Found', { status: 404 });
});

console.log(`🤖 ${BOT_TITLE} starting...`);
