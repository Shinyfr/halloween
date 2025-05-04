// index.js
require('dotenv').config();

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const db = require('./db');

async function main() {
  // 1️⃣ Initialise le stockage
  await db.init();

  // 2️⃣ Crée le client Discord
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      // GatewayIntentBits.MessageContent, // décommente si besoin de lire le contenu des messages
    ]
  });

  // Expose la DB et prépare la collection de commandes
  client.db = db;
  client.commands = new Collection();

  // 3️⃣ Chargement récursif des commandes depuis commands/ et sous-dossiers
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

  // 4️⃣ Événement ready
  client.once('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag} !`);
  });

  // 5️⃣ Gestion des interactions (boutons + sélecteurs + slash-commands)
  client.on('interactionCreate', async interaction => {
    // ── Boutons de l’aventure (/story)
    if (interaction.isButton() && interaction.customId.startsWith('story_')) {
      const uid = interaction.user.id;
      let nextNode;
      if (interaction.customId === 'story_restart') {
        nextNode = 'start';
      } else {
        const [, current, idxStr] = interaction.customId.split('_');
        const idx = parseInt(idxStr, 10);
        const node = require('./story.json')[current];
        nextNode = node.options[idx].next;
      }
      await db.set(`${uid}_story`, nextNode);
      // Réexécute la commande story pour afficher le nouveau nœud
      const storyCmd = client.commands.get('story');
      return storyCmd.execute(interaction);
    }

    // ── Menu déroulant de la boutique (/shop)
    if (interaction.isStringSelectMenu() && interaction.customId === 'shop_select') {
      const choice = interaction.values[0];
      // Simule l’option pour la commande /buy
      interaction.options = { getString: () => choice };
      const buyCmd = client.commands.get('buy');
      return buyCmd.execute(interaction);
    }

    // ── Slash-commands
    if (!interaction.isCommand()) return;
    console.log(`>> Reçu interaction : ${interaction.commandName}`);
    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;

    try {
      await cmd.execute(interaction);
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

  // 6️⃣ Connexion du bot
  await client.login(process.env.DISCORD_TOKEN);
}

main().catch(err => {
  console.error('Erreur au démarrage :', err);
  process.exit(1);
});
