// commands/notify.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('notify')
    .setDescription('Activer ou désactiver les notifications des chapitres'),
  async execute(interaction) {
    const db       = interaction.client.db;
    const uid      = interaction.user.id;
    const key      = `${uid}_notify`;
    const current  = await db.get(key) || false;
    const next     = !current;

    // Enregistre le nouveau statut tout de suite
    await db.set(key, next);

    // Prépare le bouton de toggle
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('notify_toggle')
        .setLabel(next
          ? '🔕 Désactiver les notifications'
          : '🔔 Activer les notifications'
        )
        .setStyle(next ? ButtonStyle.Danger : ButtonStyle.Success)
    );

    // Envoie une réponse éphémère avec le bouton
    return interaction.reply({
      content: next
        ? '🔔 Notifications activées ! Tu seras prévenu(e) à 9h quand un nouveau chapitre arrive.'
        : '🔕 Notifications désactivées ! Tu ne seras plus notifié(e).',
      components: [row],
      ephemeral: true
    });
  }
};
