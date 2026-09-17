import { BOT_USERNAME, BOT_TITLE } from '../config.js';

export const handleStartCommand = async (telegram, message) => {
  const me = await telegram('getMe');
  const botUsername = me.result?.username || BOT_USERNAME;
  const botTitle = me.result?.first_name || BOT_TITLE;

  const chatId = message.chat.id;
  const isUkrainian = message.from?.language_code === 'uk';

  const welcomeMessageUK = `🖼 *${botTitle}*

Шукайте зображення у будь-якому чаті!

*Як використовувати:*
Введіть, наприклад, \`@${botUsername} лебідь\` у будь-якому чаті та оберіть зображення.

*Команди:*
/start - Запустити бота
/help - Як користуватися цим ботом
/about - Про цього бота
`;

  const welcomeMessageEN = `🖼 *${botTitle}*

Search images from any chat!

*How to use:*
Type, for example, \`@${botUsername} swan\` in any chat and select an image.

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
