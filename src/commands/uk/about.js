const handleAboutCommandUK = async (telegram, chatId) => {
  await telegram('sendMessage', {
    chat_id: chatId,
    text: `*Про цього бота*

🆓 Безкоштовний
🔒 Не збирає Ваші дані
⚡ Швидкі результати

Зроблено з ❤️ в Україні`,
    parse_mode: 'Markdown',
  });
  return;
};

module.exports = {
  handleAboutCommandUK,
};
