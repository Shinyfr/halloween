// index.js
require('dotenv').config();

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs    = require('fs');
const path  = require('path');
const db    = require('./db');
const cron  = require('node-cron');

async function main() {
  // 1️⃣ Initialise le stockage
  await db.init();

  // 2️⃣ Crée le client Discord
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      // GatewayIntentBits.MessageContent, // décommente si nécessaire
    ]
  });

  client.db = db;
  client.commands = new Collection();

  // 3️⃣ Chargement récursif des commandes
  function loadCommandFiles(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
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

  // 4️⃣ Ready + notifications journalières
  client.once('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag} !`);

    // À 9h chaque jour en Europe/Paris, on notifie les joueurs
    cron.schedule('0 9 * * *', async () => {
      const keys = await db.keys();
      for (const key of keys.filter(k => k.endsWith('_storyState'))) {
        const uid   = key.split('_')[0];
        const state = await db.get(key);
        if (state.nextAvailableAt > 0 && Date.now() >= state.nextAvailableAt) {
          try {
            const user = await client.users.fetch(uid);
            await user.send(
              '📖 Ton nouveau chapitre Halloween est disponible !\n' +
              'Tape `/story` pour continuer ton aventure.'
            );
            // Réinitialise pour ne pas renoter plusieurs fois
            await db.set(key, { current: state.current, nextAvailableAt: 0 });
          } catch (e) {
            console.error(`❌ Erreur notification pour ${uid}:`, e);
          }
        }
      }
    }, { timezone: 'Europe/Paris' });
  });

  // 5️⃣ Gestion des interactions
  client.on('interactionCreate', async interaction => {
    // —— Boutons de l’aventure (/story)
    if (interaction.isButton() && interaction.customId.startsWith('story_')) {
      const uid       = interaction.user.id;
      const key       = `${uid}_storyState`;
      const storyData = require('./story.json');

      // Recommencer
      if (interaction.customId === 'story_restart') {
        await db.set(key, { current: 'start', nextAvailableAt: 0 });
        return client.commands.get('story').execute(interaction);
      }

      // Choix classique
      const [, current, idxStr] = interaction.customId.split('_');
      const idx    = parseInt(idxStr, 10);
      const option = storyData[current].options[idx];
      const next   = option.next;
      const delay  = option.delayDays || 0;
      const now    = Date.now();
      const nextAt = now + delay * 24 * 3600 * 1000;

      await db.set(key, { current: next, nextAvailableAt: nextAt });

      if (delay > 0) {
        // Affiche en heure Europe/Paris
        const when = new Date(nextAt).toLocaleString('fr-FR', {
          dateStyle: 'full',
          timeStyle: 'short',
          timeZone: 'Europe/Paris'
        });
        return interaction.reply({
          content: `⏳ Ton choix est pris en compte !\nReviens le **${when}** pour la suite.`,
          ephemeral: true
        });
      }

      // Delay = 0 → on affiche immédiatement
      return client.commands.get('story').execute(interaction);
    }

    // —— Menu déroulant (/shop)
    if (interaction.isStringSelectMenu() && interaction.customId === 'shop_select') {
      const choice = interaction.values[0];
      interaction.options = { getString: () => choice };
      return client.commands.get('buy').execute(interaction);
    }

    // —— Slash-commands
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

  // 6️⃣ Connexion
  await client.login(process.env.DISCORD_TOKEN);
}

main().catch(err => {
  console.error('❌ Erreur au démarrage :', err);
  process.exit(1);
});
