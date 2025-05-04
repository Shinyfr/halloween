// commands/admin/setbonbons.js
const { SlashCommandBuilder }      = require('@discordjs/builders');
const { EmbedBuilder,
        PermissionsBitField }      = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setbonbons')
    .setDescription('Fixe le solde de bonbons 🍬 d’un utilisateur')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addUserOption(opt => opt.setName('user').setDescription('Cible').setRequired(true))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Nouveau solde').setRequired(true)),
  async execute(interaction) {
    const db      = interaction.client.db;
    const user    = interaction.options.getUser('user');
    const amount  = interaction.options.getInteger('amount');
    const uid     = user.id;
    const oldBal  = await db.get(`${uid}_balance`) || 0;
    await db.set(`${uid}_balance`, amount);

    const embed = new EmbedBuilder()
      .setTitle('🔧 Solde ajusté')
      .setColor('#FFA500')
      .addFields(
        { name: 'Utilisateur', value: `<@${uid}>`, inline: true },
        { name: 'Avant',       value: `${oldBal} 🍬`, inline: true },
        { name: 'Maintenant',  value: `${amount} 🍬`, inline: true }
      );
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
