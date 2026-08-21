const { Client, GatewayIntentBits } = require('discord.js');
const eldPromise = import('eld/large');
const { getMainLanguage } = require('./database');

const token = process.env.DISCORD_TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`Langate online as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const text = message.content.trim();
  if (!text) return;

  const mainLanguage = await getMainLanguage(message.guild.id);

  try {
    const { eld } = await eldPromise;
    // Run offline local language detection
    const result = eld.detect(text);
    const detectedLang = result.language; // ISO 639-1 code (e.g., 'en', 'es')

    // Privacy Check: Ignore immediately if it matches the server's main language
    if (text.length > 8 && detectedLang === mainLanguage) {
      return;
    }

    // Action: Delete non-compliant messages
    if (text.length > 8 && detectedLang !== 'unknown' && detectedLang !== mainLanguage) {
      if (message.deletable) {
        await message.delete();
        const warning = await message.channel.send(
          `${message.author}, please keep messages in \`${mainLanguage.toUpperCase()}\`.`
        );
        setTimeout(() => warning.delete().catch(() => {}), 5000);
      }
    }
  } catch (err) {
    console.error('Detection error:', err);
  }
});

if (!token) {
  console.error('ERROR: DISCORD_TOKEN environment variable is missing!');
  process.exit(1);
}

client.login(token);