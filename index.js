require('dotenv').config();

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Crée le client avec les intents nécessaires
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    // Uncomment si tu veux lire le contenu des messages (pour des commandes prefixées)
    // GatewayIntentBits.MessageContent,
  ]
});

// Chargement dynamique des commandes
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  // Chaque module doit exporter { data, execute }
  client.commands.set(command.data.name, command);
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
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'Il y a eu une erreur en exécutant cette commande.', ephemeral: true });
    } else {
      await interaction.reply({ content: 'Il y a eu une erreur en exécutant cette commande.', ephemeral: true });
    }
  }
});

// Connexion au bot
client.login(process.env.DISCORD_TOKEN);
