// commands/admin/givebonbons.js
const { SlashCommandBuilder }      = require('@discordjs/builders');
const { EmbedBuilder,
        PermissionsBitField }      = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('givebonbons')
    .setDescription('Donne des bonbons 🍬 à un utilisateur')
    // tu peux laisser le defaultMemberPermissions en plus, mais il sera doublé par notre check
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addUserOption(opt => opt.setName('user').setDescription('Cible').setRequired(true))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Quantité').setRequired(true)),

  async execute(interaction) {
    const adminRole = process.env.ADMIN_ROLE_ID;
    const member    = interaction.member;

    // Vérification des permissions
    if (
      !member.roles.cache.has(adminRole)
    ) {
      return interaction.reply({
        content: '❌ Tu n’as pas la permission d’utiliser cette commande.',
        ephemeral: true
      });
    }

    // …le reste de ton code pour donner des bonbons
    const db     = interaction.client.db;
    const user   = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    const uid    = user.id;
    const oldBal = await db.get(`${uid}_balance`) || 0;
    const newBal = oldBal + amount;
    await db.set(`${uid}_balance`, newBal);

    const embed = new EmbedBuilder()
      .setTitle('✅ Bonbons attribués')
      .setColor('#00FF00')
      .addFields(
        { name: 'Utilisateur', value: `<@${uid}>`, inline: true },
        { name: 'Avant',       value: `${oldBal} 🍬`,  inline: true },
        { name: 'Après',       value: `${newBal} 🍬`,  inline: true }
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
