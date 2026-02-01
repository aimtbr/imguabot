const BOT_USERNAME = Deno.env.get('BOT_USERNAME');
const MY_USERNAME = Deno.env.get('MY_USERNAME');

export const handleHelpCommand = async (telegram, message) => {
  const chatId = message.chat.id;
  const isUkrainian = message.from?.language_code === 'uk';

  const me = await telegram('getMe');
  const botUsername = me.result?.username || BOT_USERNAME;

  const textUK = `*Як шукати зображення:*

1. Перейдіть до будь-якого чату (група, канал або особисті повідомлення)
2. Введіть: \`@${botUsername} лебідь\`
3. Зачекайте, поки з'являться результати
4. Торкніться зображення, щоб надіслати його

*Поради:*
• Використовуйте конкретні ключові слова для покращення результатів
• Почекайте трохи для завантаження результатів

*Зворотній зв'язок*
Напишіть @${MY_USERNAME}, якщо щось не працює або у Вас є пропозиції.`;

  const textEN = `*How to search images:*

1. Go to any chat (group, channel, or DM)
2. Type: \`@${botUsername} swan\`
3. Wait for results to appear
4. Tap an image to send it

*Tips:*
• Use specific keywords for better results
• Try English terms for more images
• Wait a moment for results to load

*Feedback*
Text @${MY_USERNAME} if something is not working or you have suggestions.`;

  await telegram('sendMessage', {
    chat_id: chatId,
    text: isUkrainian ? textUK : textEN,
    parse_mode: 'Markdown',
  });
  return;
};
