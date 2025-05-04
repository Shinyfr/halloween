// index.js
require('dotenv').config();

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs   = require('fs');
const path = require('path');
const db   = require('./db');

async function main() {
  // Initialise le stockage
  await db.init();

  // Crée le client Discord
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages
      // GatewayIntentBits.MessageContent, // si besoin
    ]
  });
  client.db = db;
  client.commands = new Collection();

  // Chargement récursif des commandes
  function loadCommandFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        loadCommandFiles(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        const command = require(fullPath);
        client.commands.set(command.data.name, command);
      }
    }
  }
  loadCommandFiles(path.join(__dirname, 'commands'));

  // Ready
  client.once('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag} !`);
  });

  // Interaction handler (menu + commands)
  client.on('interactionCreate', async interaction => {
    // Menu déroulant shop
    if (interaction.isStringSelectMenu() && interaction.customId === 'shop_select') {
      const choice = interaction.values[0];
      const buyCmd = client.commands.get('buy');
      interaction.options = { getString: () => choice };
      return buyCmd.execute(interaction);
    }

    if (!interaction.isCommand()) return;
    console.log(`>> Reçu interaction : ${interaction.commandName}`);
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(err);
      const payload = { content: '❌ Une erreur est survenue.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload);
      } else {
        await interaction.reply(payload);
      }
    }
  });

  // Login
  await client.login(process.env.DISCORD_TOKEN);
}

main().catch(err => {
  console.error('Erreur au démarrage :', err);
  process.exit(1);
});
