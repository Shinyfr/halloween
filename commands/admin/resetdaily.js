// commands/admin/resetdaily.js
const { SlashCommandBuilder }      = require('@discordjs/builders');
const { EmbedBuilder,
        PermissionsBitField }      = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetdaily')
    .setDescription("Réinitialise le daily d’un utilisateur")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addUserOption(opt => opt.setName('user').setDescription('Cible').setRequired(true)),
  async execute(interaction) {
    const adminRole = process.env.ADMIN_ROLE_ID;
    const member    = interaction.member;
    if (
    !member.permissions.has(PermissionsBitField.Flags.Administrator) &&
    !member.roles.cache.has(adminRole)
    ) {
    return interaction.reply({
        content: '❌ Tu n’as pas la permission d’utiliser cette commande.',
        ephemeral: true
    });
    }

    const db   = interaction.client.db;
    const user = interaction.options.getUser('user');
    const uid  = user.id;
    await db.set(`${uid}_lastDaily`, null);

    const embed = new EmbedBuilder()
      .setTitle('🔄 Daily réinitialisé')
      .setColor('#FFA500')
      .setDescription(`<@${uid}> peut réclamer à nouveau.`);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
