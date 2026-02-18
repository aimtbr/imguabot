import { handleStartCommand } from './commands/start.js';
import { handleHelpCommand } from './commands/help.js';
import { handleAboutCommand } from './commands/about.js';
import { getImagesDuckDuckGo } from './engines/duckduckgo.js';
import { getImagesGoogle } from './engines/google.js';

const BOT_TOKEN = Deno.env.get('BOT_TOKEN');
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET');
const SEARCH_ENGINE = Deno.env.get('SEARCH_ENGINE') || 'duckduckgo';

const BOT_TITLE = Deno.env.get('BOT_TITLE');

const MAX_IMAGE_TITLE_LENGTH = Number(
  Deno.env.get('MAX_IMAGE_TITLE_LENGTH') || 64,
);
const MAX_IMAGES = Number(Deno.env.get('MAX_IMAGES') || 500);
const MAX_IMAGES_PER_PAGE = Number(Deno.env.get('MAX_IMAGES_PER_PAGE') || 50);
const MIN_QUERY_LENGTH = Number(Deno.env.get('MIN_QUERY_LENGTH') || 2);

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
// Main Search Function
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
  const { id, query, from, offset = '' } = inlineQuery;

  const isUkrainian = from?.language_code === 'uk';

  const requestedOffset = Number.parseInt(offset, 10);
  const pageOffset =
    Number.isNaN(requestedOffset) || requestedOffset < 0 ? 0 : requestedOffset;

  const queryPrepared = query && query.trim();
  // Empty query - show hint
  if (!queryPrepared || queryPrepared.length < MIN_QUERY_LENGTH) {
    return telegram('answerInlineQuery', {
      inline_query_id: id,
      results: [],
      cache_time: 0,
      switch_pm_text: isUkrainian
        ? `🔍 Введіть ${MIN_QUERY_LENGTH}+ символів для пошуку...`
        : `🔍 Type ${MIN_QUERY_LENGTH}+ characters to search images...`,
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
      switch_pm_text: isUkrainian
        ? '😕 Зображень не знайдено. Спробуйте інші слова.'
        : '😕 No images found. Try different keywords.',
      switch_pm_parameter: 'help',
    });
  }

  // Get all inline results
  const allResults = images
    .filter((item) => item && item.image && item.thumbnail)
    .slice(0, MAX_IMAGES)
    .map((item, index) => ({
      type: 'photo',
      id: `${Date.now()}-${index}`,
      photo_url: item.image,
      thumbnail_url: item.thumbnail,
      photo_width: item.width,
      photo_height: item.height,
      title: (item.title || '').slice(0, MAX_IMAGE_TITLE_LENGTH),
    }));

  // Paginate results
  const pageResults = allResults.slice(
    pageOffset,
    pageOffset + MAX_IMAGES_PER_PAGE,
  );

  // Prepare the next offset for further requests
  const loadedResultsLength = pageOffset + pageResults.length;
  const hasMore = loadedResultsLength < allResults.length;
  const nextOffset = hasMore ? String(loadedResultsLength) : '';

  await telegram('answerInlineQuery', {
    inline_query_id: id,
    results: pageResults,
    cache_time: 300, // Cache for 5 minutes
    is_personal: false,
    next_offset: nextOffset,
  });

  console.log(
    `Search: "${query}" → ${loadedResultsLength}/${allResults.length} results (${source})`,
  );
}

// ============================================
// Bot Commands Handler
// ============================================

async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = message.text || '';
  const isUkrainian = message.from?.language_code === 'uk';

  // /start command
  if (text.startsWith('/start')) {
    return handleStartCommand(telegram, message);
  }

  // /help command
  if (text === '/help') {
    return handleHelpCommand(telegram, message);
  }

  // /about command
  if (text === '/about') {
    return handleAboutCommand(telegram, message);
  }

  // Unknown message - show hint
  await telegram('sendMessage', {
    chat_id: chatId,
    text: isUkrainian
      ? 'Використовуйте /help, щоб дізнатися, як шукати зображення!'
      : 'Use /help to learn how to search images!',
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

    // Set bot commands for English users
    await telegram('setMyCommands', {
      commands: [
        { command: 'start', description: 'Start the bot' },
        { command: 'help', description: 'How to use this bot' },
        { command: 'about', description: 'About this bot' },
      ],
      language_code: 'en',
    });

    // Set bot commands for Ukrainian users
    await telegram('setMyCommands', {
      commands: [
        { command: 'start', description: 'Запустити бота' },
        { command: 'help', description: 'Як користуватися цим ботом' },
        { command: 'about', description: 'Про цього бота' },
      ],
      language_code: 'uk',
    });

    // Set default commands (fallback)
    await telegram('setMyCommands', {
      commands: [
        { command: 'start', description: 'Start the bot' },
        { command: 'help', description: 'How to use this bot' },
        { command: 'about', description: 'About this bot' },
      ],
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
