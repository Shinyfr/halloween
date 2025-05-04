// commands/story.js
const { SlashCommandBuilder }  = require('@discordjs/builders');
const { EmbedBuilder }         = require('discord.js');
const storyData                = require('../story.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('story')
    .setDescription('Continue l’aventure Halloween 🔮'),
  async execute(interaction) {
    const uid   = interaction.user.id;
    const db    = interaction.client.db;
    // Récupère l’état ou initialisation
    let state = await db.get(`${uid}_storyState`);
    if (!state) {
      state = { current: 'start', nextAvailableAt: 0 };
      await db.set(`${uid}_storyState`, state);
    }

    // Si le prochain chapitre n’est pas encore débloqué :
    if (Date.now() < state.nextAvailableAt) {
      const nextDate = new Date(state.nextAvailableAt)
        .toLocaleString('fr-FR', { dateStyle:'full', timeStyle:'short' });
      return interaction.reply({
        content: `⏳ **Patiente jusqu’au ${nextDate}** pour découvrir la suite…`,
        ephemeral: true
      });
    }

    // Sinon, on affiche le nœud courant
    const node = storyData[state.current];
    const embed = new EmbedBuilder()
      .setTitle('🕯️ Aventure Halloween')
      .setColor('#8B0000')
      .setDescription(node.text);

    // Construction des boutons
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    const row = new ActionRowBuilder();
    if (node.options.length > 0) {
      node.options.forEach((opt, i) => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`story_${state.current}_${i}`)
            .setLabel(opt.label)
            .setStyle(ButtonStyle.Primary)
        );
      });
    } else {
      // fin de partie → proposer de recommencer
      row.addComponents(
        new ButtonBuilder()
          .setCustomId('story_restart')
          .setLabel('Recommencer')
          .setStyle(ButtonStyle.Secondary)
      );
    }

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
};
