export const handleAboutCommand = async (telegram, message) => {
  const chatId = message.chat.id;
  const isUkrainian = message.from?.language_code === 'uk';

  const textUK = `*Про цього бота*

🆓 Безкоштовний
🔒 Не збирає Ваші дані
⚡ Швидкі результати

Зроблено з ❤️ в Україні`;

  const textEN = `*About this bot*

🆓 Free to use
🔒 No data collected
⚡ Fast results

Made with ❤️ from Ukraine`;

  await telegram('sendMessage', {
    chat_id: chatId,
    text: isUkrainian ? textUK : textEN,
    parse_mode: 'Markdown',
  });
  return;
};
