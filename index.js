require('dotenv').config();

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs   = require('fs');
const path = require('path');
const db   = require('./db');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ]
});

client.commands = new Collection();
// Chargement dynamique des commandes
for (const file of fs.readdirSync(path.join(__dirname,'commands')).filter(f => f.endsWith('.js'))) {
  const cmd = require(`./commands/${file}`);
  client.commands.set(cmd.data.name, cmd);
}

client.once('ready', () => {
  console.log(`Connecté en tant que ${client.user.tag} !`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId !== 'shop_select') return;

  const chosenId = interaction.values[0];
  // On délègue au code de /buy
  const buyCommand = client.commands.get('buy');
  // On simule une option pour buy
  interaction.options = {
    getString: () => chosenId
  };
  return buyCommand.execute(interaction);
});

(async () => {
  // Initialise le stockage puis connecte le bot
  await db.init();
  client.db = db;
  client.login(process.env.DISCORD_TOKEN);
})();
