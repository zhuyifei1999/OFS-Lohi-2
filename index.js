const events = require('events');
const fs = require('fs');

const YAML = require('yaml');
const {Client, GatewayIntentBits} = require('discord.js');

const discord = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const config = YAML.parse(fs.readFileSync('./config.yaml', 'utf8'));
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
    const actions = config.channels[message.channelId];
    if (!actions) {
      return;
    }

    for (const action of actions) {
      try {
        const handleOp = (op) => {
          switch (op.type) {
            case 'logical_AND':
              return op.operands.every(handleOp);
            case 'logical_OR':
              return op.operands.some(handleOp);
            case 'logical_NOT':
              return !handleOp(op.operand);

            case 'mentions_size':
              return message.mentions[op.attr]?.size;
            case 'mentions_bool':
              return !!message.mentions[op.attr];
            case 'mentions_has':
              return message.mentions[op.attr]?.has(op.id);

            default:
              throw new Error(`Unhandled op type ${op.type}`);
          }
        };

        if (handleOp(action.when)) {
          switch (action.action) {
            case 'delete':
              console.log(`Delete message in channel ${message.channelId}: ` +
                message.cleanContent);
              await message.delete();
              continue;
            default:
              throw new Error(`Unhandled action ${action.action}`);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  });
}());
