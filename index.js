// index.js
require('dotenv').config();
console.log('[DEBUG] STORY_TEST_MODE =', process.env.STORY_TEST_MODE);

const {
  Client,
  GatewayIntentBits,
  Collection,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
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

  // 4️⃣ Ready + notifications journalières (cron)
  client.once('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag} !`);
    cron.schedule('0 9 * * *', async () => {
      const keys = await db.keys();
      for (const key of keys.filter(k => k.endsWith('_storyState'))) {
        const uid         = key.split('_')[0];
        const notifyKey   = `${uid}_notify`;
        const subscribed  = await db.get(notifyKey);
        if (!subscribed) continue;            // only notify opt-in users
        const st = await db.get(key);
        if (st.nextAvailableAt > 0 && Date.now() >= st.nextAvailableAt) {
          try {
            const u = await client.users.fetch(uid);
            await u.send(
              '📖 Ton nouveau chapitre Halloween est disponible !\n' +
              'Tape `/story` pour continuer ton aventure.'
            );
            // reset so we don't notify again
            await db.set(key, { current: st.current, nextAvailableAt: 0 });
          } catch (e) {
            console.error(`Erreur notification pour ${uid}:`, e);
          }
        }
      }
    }, { timezone: 'Europe/Paris' });
  });

  // 5️⃣ Gestion des interactions
  client.on('interactionCreate', async interaction => {
    // —— Bouton d'opt-in notifications
    if (interaction.isButton() && interaction.customId === 'notify_toggle') {
      const uid       = interaction.user.id;
      const notifyKey = `${uid}_notify`;
      const current   = await db.get(notifyKey) || false;
      const next      = !current;
      await db.set(notifyKey, next);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('notify_toggle')
          .setLabel(next ? '🔕 Désactiver notifications' : '🔔 Activer notifications')
          .setStyle(next ? ButtonStyle.Danger : ButtonStyle.Success)
      );
      // update the ephemeral message
      return interaction.update({
        content: next
          ? '🔔 Notifications activées !'
          : '🔕 Notifications désactivées !',
        components: [row]
      });
    }

    // —— Boutons de l’aventure (/story)
    if (interaction.isButton() && interaction.customId.startsWith('story_')) {
      const uid       = interaction.user.id;
      const stateKey  = `${uid}_storyState`;
      const storyData = require('./story.json');

      // « Recommencer »
      if (interaction.customId === 'story_restart') {
        await db.set(stateKey, { current: 'start', nextAvailableAt: 0 });
        return client.commands.get('story').execute(interaction);
      }

      // Choix de branche
      const [, current, idxStr] = interaction.customId.split('_');
      const idx      = parseInt(idxStr, 10);
      const opt      = storyData[current].options[idx];
      const next     = opt.next;
      const rawDelay = opt.delayDays || 0;
      const isTest   = process.env.STORY_TEST_MODE === 'true';
      const days     = isTest ? 0 : rawDelay;
      const now      = new Date();

      // Calcul du timestamp de déblocage à minuit si jours réels
      let nextAt;
      if (days === 0 || isTest) {
        nextAt = now.getTime();
      } else {
        const target = new Date(now);
        target.setDate(now.getDate() + days);
        target.setHours(0, 0, 0, 0);
        nextAt = target.getTime();
      }

      console.log(
        `[DEBUG] story: current=${current}, rawDelay=${rawDelay}, ` +
        `isTest=${isTest}, days=${days}, nextAt=${new Date(nextAt)}`
      );

      await db.set(stateKey, { current: next, nextAvailableAt: nextAt });

      if (days > 0) {
        // Custom cooldown message
        return interaction.reply({
          content: '⏳ Ton choix est pris en compte ! Reviens demain !',
          ephemeral: true
        });
      }

      // délai 0 → on continue immédiatement
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
  console.error('❌ Erreur au démarrage :', err);
  process.exit(1);
});
