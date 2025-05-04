const { SlashCommandBuilder }             = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder,
        StringSelectMenuBuilder }         = require('discord.js');
const shop = require('../shop.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Affiche la boutique 🎃🛒'),
  async execute(interaction) {
    // Embed
    const embed = new EmbedBuilder()
      .setTitle('🎃 Boutique Halloween')
      .setColor('#FFA500')
      .setDescription('Sélectionne un article dans le menu déroulant ci-dessous :');

    // Ajout de champs pour l’affichage
    shop.forEach(item => {
      embed.addFields({
        name: `${item.name} — ${item.price} 🍬`,
        value: item.desc,
        inline: true
      });
    });

    // Menu déroulant
    const menu = new StringSelectMenuBuilder()
      .setCustomId('shop_select')
      .setPlaceholder('Choisis ton article')
      .addOptions(
        shop.map(item => ({
          label: item.name,
          description: `${item.price} 🍬 — ${item.id}`,
          value: item.id,
          emoji: item.emoji ?? '🛒'
        }))
      );

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};
