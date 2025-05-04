const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder }        = require('discord.js');
const shop                   = require('../shop.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription("Affiche la liste de tes achats 🎒"),
  async execute(interaction) {
    const db  = interaction.client.db;
    const uid = interaction.user.id;

    // Récupère l'inventaire
    const inv = await db.get(`${uid}_inv`) || [];

    if (inv.length === 0) {
      return interaction.reply({ content: '🛒 Ton inventaire est vide.'});
    }

    // Compte combien de chaque item
    const counts = inv.reduce((acc, id) => {
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {});

    // Construis un embed
    const embed = new EmbedBuilder()
      .setTitle('🎒 Ton inventaire')
      .setColor('#FFA500');

    for (const [id, qty] of Object.entries(counts)) {
      const item = shop.find(i => i.id === id);
      const name = item ? item.name : id;
      embed.addFields({ name: name, value: `Quantité : ${qty}`, inline: true });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
