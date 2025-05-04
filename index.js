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

function getParisOffsetMs() {
  const now = new Date();
  // timestamp UTC
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  // Paris local timestamp
  const parisTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' })).getTime();
  return parisTime - utc;
}

async function main() {
  await db.init();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      // GatewayIntentBits.MessageContent,
    ]
  });
  client.db = db;
  client.commands = new Collection();

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

  client.once('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag} !`);
    cron.schedule('0 9 * * *', async () => {
      const keys = await db.keys();
      for (const key of keys.filter(k => k.endsWith('_storyState'))) {
        const uid = key.split('_')[0];
        const subscribed = await db.get(`${uid}_notify`);
        if (!subscribed) continue;
        const st = await db.get(key);
        if (st.nextAvailableAt > 0 && Date.now() >= st.nextAvailableAt) {
          try {
            const u = await client.users.fetch(uid);
            await u.send(
              '📖 Ton nouveau chapitre Halloween est disponible !\n' +
              'Tape `/story` pour continuer ton aventure.'
            );
            await db.set(key, { current: st.current, nextAvailableAt: 0 });
          } catch (e) {
            console.error(`Erreur notif pour ${uid}:`, e);
          }
        }
      }
    }, { timezone: 'Europe/Paris' });
  });

  client.on('interactionCreate', async interaction => {
    if (interaction.isButton() && interaction.customId === 'notify_toggle') {
      const uid = interaction.user.id;
      const key = `${uid}_notify`;
      const cur = await db.get(key) || false;
      const nextState = !cur;
      await db.set(key, nextState);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('notify_toggle')
          .setLabel(nextState ? '🔕 Désactiver notifications' : '🔔 Activer notifications')
          .setStyle(nextState ? ButtonStyle.Danger : ButtonStyle.Success)
      );
      return interaction.update({
        content: nextState
          ? '🔔 Notifications activées !'
          : '🔕 Notifications désactivées !',
        components: [row]
      });
    }

    if (interaction.isButton() && interaction.customId.startsWith('story_')) {
      const uid = interaction.user.id;
      const stateKey = `${uid}_storyState`;
      const storyData = require('./story.json');

      if (interaction.customId === 'story_restart') {
        await db.set(stateKey, { current: 'start', nextAvailableAt: 0 });
        return client.commands.get('story').execute(interaction);
      }

      const [, current, idxStr] = interaction.customId.split('_');
      const idx = parseInt(idxStr, 10);
      const opt = storyData[current].options[idx];
      const next = opt.next;
      const rawDays = opt.delayDays ?? 1;
      const isTest = process.env.STORY_TEST_MODE === 'true';
      const days = isTest ? 0 : rawDays;
      const now = new Date();

      let nextAt;
      if (days === 0) {
        nextAt = now.getTime();
      } else {
        // compute Paris-local midnight for now + days
        const offsetMs = getParisOffsetMs();
        const target = new Date(now);
        target.setDate(target.getDate() + days);
        target.setHours(0, 0, 0, 0);
        // target is midnight UTC; shift to Paris midnight
        nextAt = target.getTime() - offsetMs;
      }

      console.log(
        `[DEBUG] story: ${current} → ${opt.next}, days=${days}, nextAt=${new Date(nextAt).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`
      );

      await db.set(stateKey, { current: next, nextAvailableAt: nextAt });

      if (days > 0) {
        const when = new Date(nextAt).toLocaleString('fr-FR', {
          dateStyle: 'full',
          timeStyle: 'short',
          timeZone: 'Europe/Paris'
        });
        return interaction.reply({
          content: `⏳ Ton choix est pris en compte !\nReviens demain pour la suite.`,
          ephemeral: true
        });
      }

      return client.commands.get('story').execute(interaction);
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'shop_select') {
      interaction.options = { getString: () => interaction.values[0] };
      return client.commands.get('buy').execute(interaction);
    }

    if (!interaction.isCommand()) return;
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

  await client.login(process.env.DISCORD_TOKEN);
}

main().catch(err => {
  console.error('❌ Erreur au démarrage :', err);
  process.exit(1);
});
