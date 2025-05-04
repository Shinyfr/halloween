// commands/daily.js
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Réclame ton bonus quotidien de bonbons'),
  async execute(interaction) {
    const db = interaction.client.db;
    const uid = interaction.user.id;
    const now = Date.now();
    const last = await db.get(uid+'_lastDaily') || 0;
    const cd  = 24*60*60*1000;

    if (now - last < cd) {
      const rem = cd - (now - last);
      const h = Math.floor(rem/3600000), m = Math.floor((rem%3600000)/60000);
      return interaction.reply({ content: `⏳ Retente dans ${h}h${m}m.`, ephemeral: true });
    }

    const gain = 5;
    const oldBal = await db.get(uid+'_balance') || 0;
    await db.set(uid+'_balance', oldBal + gain);
    await db.set(uid+'_lastDaily', now);

    await interaction.reply(`🎁 Tu as gagné **${gain}** bonbon${gain>1?'s':''}! Total: **${oldBal+gain}**.`);
  }
};
