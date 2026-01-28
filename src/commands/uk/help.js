const BOT_USERNAME = Deno.env.get('BOT_USERNAME');
const MY_USERNAME = Deno.env.get('MY_USERNAME');

export const handleHelpCommandUK = async (telegram, chatId) => {
  const me = await telegram('getMe');
  const botUsername = me.result?.username || BOT_USERNAME;

  await telegram('sendMessage', {
    chat_id: chatId,
    text: `*Як шукати зображення:*

1. Перейдіть до будь-якого чату (група, канал або особисті повідомлення)
2. Введіть: \`@${botUsername} Ваш запит\`
3. Зачекайте, поки з'являться результати
4. Торкніться зображення, щоб надіслати його

*Поради:*
• Використовуйте конкретні ключові слова для покращення результатів
• Почекайте трохи для завантаження результатів

*Зворотній зв'язок*
Напишіть @${MY_USERNAME}, якщо щось не працює або у Вас є пропозиції.`,
    parse_mode: 'Markdown',
  });
  return;
};
