// commands/daily.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Réclame ton bonus quotidien de bonbons 🍬'),
  async execute(interaction) {
    const db   = interaction.client.db;
    const uid  = interaction.user.id;
    const today = new Date().toISOString().slice(0,10); // "YYYY-MM-DD"
    const last  = await db.get(`${uid}_lastDaily`) || null;

    if (last === today) {
      return interaction.reply({
        content: `⏳ Tu as déjà réclamé ton daily aujourd’hui.`
      });
    }

    const gain      = 5;
    const oldBal    = await db.get(`${uid}_balance`) || 0;
    const newBalance= oldBal + gain;

    // Sauvegarde
    await db.set(`${uid}_balance`,       newBalance);
    await db.set(`${uid}_lastDaily`,     today);

    // Embed de réponse
    const embed = new EmbedBuilder()
      .setTitle('🎃 Bonus quotidien débloqué !')
      .setColor('#FF7518')
      .setDescription(
        `Tu as gagné **${gain}** bonbon${gain>1?'s':''} 🍬\n\n` +
        `**Total** : ${newBalance} 🍬`
      )
      .setFooter({ text: `Reviens demain à minuit pour un nouveau bonus` });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
