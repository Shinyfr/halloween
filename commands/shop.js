// commands/shop.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const shop = require('../shop.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Affiche la boutique'),
  async execute(interaction) {
    const list = shop.map(i => 
      `**${i.id}** — ${i.name} (${i.price}🍬)\n> ${i.desc}`
    ).join('\n\n');
    await interaction.reply({ content: list, ephemeral: true });
  }
};
