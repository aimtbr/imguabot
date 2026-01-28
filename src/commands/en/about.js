export const handleAboutCommandEN = async (telegram, chatId) => {
  await telegram('sendMessage', {
    chat_id: chatId,
    text: `*About this bot*

🆓 Free to use
🔒 No data collected
⚡ Fast results

Made with ❤️ from Ukraine`,
    parse_mode: 'Markdown',
  });
  return;
};
