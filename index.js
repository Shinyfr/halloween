// index.js
require('dotenv').config();
console.log('[DEBUG] STORY_TEST_MODE =', process.env.STORY_TEST_MODE);

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
      // GatewayIntentBits.MessageContent, // décommente si besoin
    ]
  });
  client.db = db;
  client.commands = new Collection();

  // 3️⃣ Chargement récursif des commandes
  (function load(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) load(full);
      else if (ent.isFile() && ent.name.endsWith('.js')) {
        const cmd = require(full);
        client.commands.set(cmd.data.name, cmd);
      }
    }
  })(path.join(__dirname, 'commands'));

  // 4️⃣ Ready + notifications journalières
  client.once('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag} !`);
    cron.schedule('0 9 * * *', async () => {
      const keys = await db.keys();
      for (const key of keys.filter(k => k.endsWith('_storyState'))) {
        const uid   = key.split('_')[0];
        const st    = await db.get(key);
        if (st.nextAvailableAt > 0 && Date.now() >= st.nextAvailableAt) {
          try {
            const u = await client.users.fetch(uid);
            await u.send(
              '📖 Nouveau chapitre Halloween dispo ! Tape `/story` pour continuer.'
            );
            await db.set(key, { current: st.current, nextAvailableAt: 0 });
          } catch (e) {
            console.error(`Erreur de notification (${uid}):`, e);
          }
        }
      }
    }, { timezone: 'Europe/Paris' });
  });

  // 5️⃣ Gestion des interactions
  client.on('interactionCreate', async interaction => {
    // —— Story buttons (avec override test mode)
    if (interaction.isButton() && interaction.customId.startsWith('story_')) {
      const uid    = interaction.user.id;
      const stateKey = `${uid}_storyState`;
      const storyData = require('./story.json');

      // « Recommencer »
      if (interaction.customId === 'story_restart') {
        await db.set(stateKey, { current: 'start', nextAvailableAt: 0 });
        return client.commands.get('story').execute(interaction);
      }

      // Choix
      const [, current, idxStr] = interaction.customId.split('_');
      const idx    = parseInt(idxStr, 10);
      const opt    = storyData[current].options[idx];
      const next   = opt.next;
      const rawDelay = opt.delayDays || 0;
      const isTest = process.env.STORY_TEST_MODE === 'true';
      const days   = isTest ? 0 : rawDelay;
      const nextAt = Date.now() + days * 24 * 3600 * 1000;

      console.log(
        `[DEBUG] story: current=${current}, rawDelay=${rawDelay}, ` +
        `isTest=${isTest}, effectiveDelay=${days}`
      );

      await db.set(stateKey, { current: next, nextAvailableAt: nextAt });

      if (days > 0) {
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

      // délai 0 → on affiche immédiatement
      return client.commands.get('story').execute(interaction);
    }

    // —— Menu déroulant (/shop)
    if (interaction.isStringSelectMenu() && interaction.customId === 'shop_select') {
      interaction.options = { getString: () => interaction.values[0] };
      return client.commands.get('buy').execute(interaction);
    }

    // —— Slash-commands
    if (!interaction.isCommand()) return;
    console.log(`>> Reçu interaction : ${interaction.commandName}`);
    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;

    try {
      await cmd.execute(interaction);
    } catch (err) {
      console.error(err);
      const pay = { content: '❌ Une erreur est survenue.', ephemeral: true };
      if (interaction.replied || interaction.deferred) await interaction.followUp(pay);
      else await interaction.reply(pay);
    }
  });

  // 6️⃣ Connexion du bot
  await client.login(process.env.DISCORD_TOKEN);
}

main().catch(err => {
  console.error('❌ Erreur au démarrage :', err);
  process.exit(1);
});
