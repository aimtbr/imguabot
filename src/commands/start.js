const BOT_USERNAME = Deno.env.get('BOT_USERNAME');
const BOT_TITLE = Deno.env.get('BOT_TITLE');

export const handleStartCommand = async (telegram, chatId) => {
  // Get bot username for inline example
  const me = await telegram('getMe');
  const botUsername = me.result?.username || BOT_USERNAME;

  const welcomeMessage = `🖼 *${BOT_TITLE}*

Search images from any Telegram chat!
Шукайте зображення в будь-якому чаті!

*How to use:*
Type \`@${botUsername} dove\` in any chat and select an image.

*Як використовувати:*
Введіть \`@${botUsername} dove\` у будь-якому чаті та оберіть зображення.
`;

  await telegram('sendMessage', {
    chat_id: chatId,
    text: welcomeMessage,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔍 Try it now!', switch_inline_query: 'cute puppies' }],
      ],
    },
  });
  return;
};
