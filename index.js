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
  if (!interaction.isCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    if (interaction.replied||interaction.deferred) 
      await interaction.followUp({ content: 'Erreur.', ephemeral: true });
    else
      await interaction.reply({ content: 'Erreur.', ephemeral: true });
  }
});

(async () => {
  // Initialise le stockage puis connecte le bot
  await db.init();
  client.db = db;
  client.login(process.env.DISCORD_TOKEN);
})();
