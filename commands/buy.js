// commands/buy.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const shop = require('../shop.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Achète un objet')
    .addStringOption(o => o
      .setName('item')
      .setDescription('ID de l’objet')
      .setRequired(true)
    ),
  async execute(interaction) {
    const db = interaction.client.db;
    const uid = interaction.user.id;
    const choice = interaction.options.getString('item').toLowerCase();
    const prod = shop.find(i => i.id === choice);
    if (!prod) return interaction.reply({ content: '❌ Introuvable.', ephemeral: true });

    const bal = await db.get(uid+'_balance') || 0;
    if (bal < prod.price) {
      return interaction.reply({ content: `❌ Il te manque ${prod.price-bal}🍬.`, ephemeral: true });
    }

    await db.set(uid+'_balance', bal - prod.price);
    const inv = await db.get(uid+'_inv') || [];
    inv.push(prod.id);
    await db.set(uid+'_inv', inv);

    await interaction.reply(`✅ Achat: **${prod.name}** pour ${prod.price}🍬`);
  }
};
