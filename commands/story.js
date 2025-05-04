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

    // Récupère ou initialise l’état
    let state = await db.get(`${uid}_storyState`);
    if (!state) {
      state = { current: 'start', nextAvailableAt: 0 };
      await db.set(`${uid}_storyState`, state);
    }

    // Cooldown si applicable
    if (Date.now() < state.nextAvailableAt) {
      const when = new Date(state.nextAvailableAt).toLocaleString('fr-FR', {
        dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Paris'
      });
      return interaction.reply({
        content: `⏳ Patiente jusqu’au **${when}** pour la suite…`,
        ephemeral: true
      });
    }

    // Charge le noeud courant
    const node = storyData[state.current];
    const embed = new EmbedBuilder()
      .setTitle(node.ending === 'death' ? '💀 RIP, tu es mort !' : '🕯️ Aventure Halloween')
      .setColor(node.ending === 'death' ? '#8B0000' : '#008000')
      .setDescription(node.text);

    // Si succès et reward, ajoute champ récompense
    if (node.ending === 'success' && node.reward) {
      const oldBal = await db.get(`${uid}_balance`) || 0;
      const newBal = oldBal + node.reward;
      await db.set(`${uid}_balance`, newBal);
      embed.addFields({
        name: '🎉 Récompense',
        value: `+${node.reward} bonbon${node.reward>1?'s':''}\n**Solde** : ${newBal} 🍬`
      });
      embed.setFooter({ text: 'Bravo, tu as réussi !' });
    }

    // Prépare l’image si définie
    const files = [];
    if (node.image) {
      const fullPath = path.join(__dirname, '..', node.image);
      const filename = path.basename(node.image);
      embed.setImage(`attachment://${filename}`);
      files.push({ attachment: fullPath, name: filename });
    }

    // Construit les boutons
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
      // Fin de partie : bouton recommencer
      row.addComponents(
        new ButtonBuilder()
          .setCustomId('story_restart')
          .setLabel('Recommencer')
          .setStyle(ButtonStyle.Secondary)
      );
    }

    const payload = {
      embeds: [embed],
      components: [row],
      files,
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(payload);
    } else {
      await interaction.reply(payload);
    }
  }
};
