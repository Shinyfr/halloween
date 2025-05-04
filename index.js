require('dotenv').config();

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs   = require('fs');
const path = require('path');
const db   = require('./db');

async function main() {
  await db.init();

  // 2️⃣ Crée le client Discord
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
    ]
  });

  // Expose la db sur le client
  client.db = db;

  client.commands = new Collection();
  const commandsPath = path.join(__dirname, 'commands');
  for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
    const cmd = require(`./commands/${file}`);
    client.commands.set(cmd.data.name, cmd);
  }

  // Handlers d’événements
  client.once('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag} !`);
  });

  client.on('interactionCreate', async interaction => {
    // Menu déroulant de la boutique
    if (interaction.isStringSelectMenu() && interaction.customId === 'shop_select') {
      const choice = interaction.values[0];
      const buyCmd = client.commands.get('buy');
      // Simule l'option pour /buy
      interaction.options = { getString: () => choice };
      return buyCmd.execute(interaction);
    }

    // Slash-commands
    if (!interaction.isCommand()) return;
    console.log(`>> Reçu interaction : ${interaction.commandName}`);

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(err);
      const replyPayload = { content: '❌ Une erreur est survenue.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(replyPayload);
      } else {
        await interaction.reply(replyPayload);
      }
    }
  });

  // Connexion
  await client.login(process.env.DISCORD_TOKEN);
}

// Démarrage
main().catch(err => {
  console.error('Erreur au démarrage :', err);
  process.exit(1);
});
