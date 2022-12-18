const events = require('events');

const {Client, GatewayIntentBits} = require('discord.js');

const discord = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const config = require('./config.json');
try {
  Object.assign(config, require('./config.private.json'));
} catch (e) {
  console.warn('No config.private.json found');
}

(async function() {
  discord.login(config.token);
  await events.once(discord, 'ready');

  discord.on('messageCreate', async (message) => {
    if (message.author.bot || message.author.system) {
      return;
    }
    if (!config.channels.includes(message.channelId)) {
      return;
    }

    const mentions = message.mentions;
    if (
      mentions.channels?.size ||
      mentions.crosspostedChannels?.size ||
      mentions.everyone ||
      mentions.members?.size ||
      mentions.repliedUser ||
      mentions.roles?.size ||
      mentions.users?.size
    ) {
      return;
    }

    console.log(`Delete message in channel ${message.channelId}: ` +
      message.cleanContent);
    try {
      await message.delete();
    } catch (e) {
      console.error(e);
    }
  });
}());
