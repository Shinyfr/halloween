// commands/story.js
const { SlashCommandBuilder }    = require('@discordjs/builders');
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const storyData = require('../story.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('story')
    .setDescription('Commence ou continue ton aventure Halloween'),
  async execute(interaction) {
    const db    = interaction.client.db;
    const uid   = interaction.user.id;
    // Récupère l’étape courante, ou "start"
    const current = (await db.get(`${uid}_story`)) || 'start';
    await db.set(`${uid}_story`, current);
    // Génère embed + boutons
    await renderNode(interaction, current);
  }
};

// Fonction utilitaire
async function renderNode(interaction, nodeId) {
  const node = storyData[nodeId];
  const embed = new EmbedBuilder()
    .setTitle('🕯️ Aventure Halloween')
    .setColor('#8B0000')
    .setDescription(node.text);

  const row = new ActionRowBuilder();
  if (node.options.length > 0) {
    node.options.forEach((opt, idx) => {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`story_${nodeId}_${idx}`)
          .setLabel(opt.label)
          .setStyle(ButtonStyle.Primary)
      );
    });
  } else {
    // Fin de partie : bouton "Recommencer"
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('story_restart')
        .setLabel('Recommencer')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  // Si c'est la première exécution, reply ; sinon update
  if (interaction.replied || interaction.deferred) {
    await interaction.editReply({ embeds: [embed], components: [row] });
  } else {
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
}
