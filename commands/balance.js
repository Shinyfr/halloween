// commands/balance.js
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Montre ton solde de bonbons 🍬'),
  async execute(interaction) {
    const uid = interaction.user.id;
    const bal = await interaction.client.db.get(uid+'_balance') || 0;
    await interaction.reply(`Tu as **${bal}** bonbon${bal>1?'s':''} 🍬`);
  }
};
