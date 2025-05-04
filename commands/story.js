// commands/story.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const path      = require('path');
const storyData = require('../story.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('story')
    .setDescription('Commence ou continue ton aventure Halloween'),
  async execute(interaction) {
    const db  = interaction.client.db;
    const uid = interaction.user.id;

    // 📦 récupère ou initialise l'état
    let state = await db.get(`${uid}_storyState`);
    if (!state) {
      state = { current: 'start', nextAvailableAt: 0 };
      await db.set(`${uid}_storyState`, state);
    }

    // ⏳ cooldown (si delayDays > 0 en mode réel)
    if (Date.now() < state.nextAvailableAt) {
      const when = new Date(state.nextAvailableAt).toLocaleString('fr-FR', {
        dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Paris'
      });
      return interaction.reply({
        content: `⏳ Patiente jusqu’au **${when}** pour la suite…`,
        ephemeral: true
      });
    }

    // 📖 on charge la scène
    const node = storyData[state.current];
    const embed = new EmbedBuilder()
      .setTitle(node.ending === 'death' ? '💀 RIP, tu es mort !' : '🕯️ Aventure Halloween')
      .setColor(node.ending === 'death' ? '#8B0000' : '#008000')
      .setDescription(node.text);

    // 📎 prépare l’image s’il y en a
    const attachments = [];
    if (node.image) {
      // chemin local : assets/story/tonImage.png
      const fullPath = path.join(__dirname, '..', node.image);
      const filename = path.basename(node.image);
      // attache et pointe l’embed dessus
      attachments.push({ attachment: fullPath, name: filename });
      embed.setImage(`attachment://${filename}`);
    }

    // 🔘 boutons
    const row = new ActionRowBuilder();
    if (node.options.length > 0) {
      node.options.forEach((opt, idx) => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`story_${state.current}_${idx}`)
            .setLabel(opt.label)
            .setStyle(ButtonStyle.Primary)
        );
      });
    } else {
      // 📈 gestion des fins (reward / ending déjà dans l’embed si besoin)
      row.addComponents(
        new ButtonBuilder()
          .setCustomId('story_restart')
          .setLabel('Recommencer')
          .setStyle(ButtonStyle.Secondary)
      );
    }

    // 🚀 envoie la réponse avec fichiers
    const payload = {
      embeds: [embed],
      components: [row],
      files: attachments,
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(payload);
    } else {
      await interaction.reply(payload);
    }
  }
};
