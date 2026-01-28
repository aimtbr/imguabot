const BOT_USERNAME = Deno.env.get('BOT_USERNAME');
const MY_USERNAME = Deno.env.get('MY_USERNAME');

const handleHelpCommandEN = async (telegram, chatId) => {
  const me = await telegram('getMe');
  const botUsername = me.result?.username || BOT_USERNAME;

  await telegram('sendMessage', {
    chat_id: chatId,
    text: `*How to search images:*

1. Go to any chat (group, channel, or DM)
2. Type: \`@${botUsername} your search\`
3. Wait for results to appear
4. Tap an image to send it

*Tips:*
• Use specific keywords for better results
• Try English terms for more images
• Wait a moment for results to load

*Feedback*
Text @${MY_USERNAME} if something is not working or you have suggestions.
`,
    parse_mode: 'Markdown',
  });
  return;
};

module.exports = {
  handleHelpCommandEN,
};
