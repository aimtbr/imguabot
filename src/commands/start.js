const BOT_USERNAME = Deno.env.get('BOT_USERNAME');
const BOT_TITLE = Deno.env.get('BOT_TITLE');

export const handleStartCommand = async (telegram, message) => {
  // Get bot username for inline example
  const me = await telegram('getMe');
  const botUsername = me.result?.username || BOT_USERNAME;

  const chatId = message.chat.id;
  const isUkrainian = message.from?.language_code === 'uk';

  const welcomeMessageUK = `🖼 *${BOT_TITLE}*

Шукайте зображення в будь-якому чаті!

*Як використовувати:*
Введіть \`@${botUsername} голуб\` у будь-якому чаті та оберіть зображення.

*Команди:*
/start - Запустити бота
/допомога - Як користуватися цим ботом
/опис - Про цього бота
`;

  const welcomeMessageEN = `🖼 *${BOT_TITLE}*

Search images from any chat!

*How to use:*
Type \`@${botUsername} dove\` in any chat and select an image.

*Commands:*
/start - Start the bot
/help - How to use this bot
/about - About this bot
`;

  await telegram('sendMessage', {
    chat_id: chatId,
    text: isUkrainian ? welcomeMessageUK : welcomeMessageEN,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: isUkrainian ? '🔍 Спробувати!' : '🔍 Try it!',
            switch_inline_query: isUkrainian ? 'милі цуценята' : 'cute puppies',
          },
        ],
      ],
    },
  });
  return;
};
