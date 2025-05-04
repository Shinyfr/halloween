// commands/story.js
const { SlashCommandBuilder } = require('@discordjs/builders');
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
    const db  = interaction.client.db;
    const uid = interaction.user.id;

    // Récupère ou initialise l'état
    let state = await db.get(`${uid}_storyState`);
    if (!state) {
      state = { current: 'start', nextAvailableAt: 0 };
      await db.set(`${uid}_storyState`, state);
    }

    // Si on est en cooldown (mode jours réels)
    if (Date.now() < state.nextAvailableAt) {
      const when = new Date(state.nextAvailableAt).toLocaleString('fr-FR', {
        dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Paris'
      });
      return interaction.reply({
        content: `⏳ Patiente jusqu’au **${when}** pour la suite…`,
        ephemeral: true
      });
    }

    // Génère l'embed pour le noeud courant
    const node = storyData[state.current];
    const embed = new EmbedBuilder()
      .setTitle('🕯️ Aventure Halloween')
      .setColor(node.ending === 'death' ? '#8B0000' : '#008000')
      .setDescription(node.text);

    // Construction des boutons
    const row = new ActionRowBuilder();
    if (node.options.length > 0) {
      for (let i = 0; i < node.options.length; i++) {
        const opt = node.options[i];
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`story_${state.current}_${i}`)
            .setLabel(opt.label)
            .setStyle(ButtonStyle.Primary)
        );
      }
    } else {
      // Noeud final → gestion de l'ending
      if (node.ending === 'death') {
        embed.setTitle('💀 RIP, tu es mort !');
      } else if (node.ending === 'success' && node.reward) {
        // Attribution de la récompense
        const oldBal = await db.get(`${uid}_balance`) || 0;
        const newBal = oldBal + node.reward;
        await db.set(`${uid}_balance`, newBal);
        embed.addFields({
          name: '🎉 Récompense',
          value: `+${node.reward} bonbon${node.reward>1?'s':''}\n` +
                 `**Nouveau solde** : ${newBal} 🍬`
        });
        embed.setFooter({ text: 'Bravo, tu as réussi !' });
      }

      // Bouton « Recommencer »
      row.addComponents(
        new ButtonBuilder()
          .setCustomId('story_restart')
          .setLabel('Recommencer')
          .setStyle(ButtonStyle.Secondary)
      );
    }

    // Envoi ou mise à jour du message
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [row] });
    } else {
      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
  }
};
