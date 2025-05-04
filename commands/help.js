// commands/help.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder }        = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Affiche la liste des commandes disponibles'),
  async execute(interaction) {
    // Liste des commandes à ne PAS afficher
    const hidden = ['givebonbons', 'resetdaily', 'setbonbons'];

    const embed = new EmbedBuilder()
      .setTitle('🤖 Aide des commandes')
      .setColor('#00AAFF')
      .setDescription('Voici toutes les commandes que tu peux utiliser :');

    // Parcourt la collection de commandes en filtrant les commandes cachées
    interaction.client.commands
      .filter(cmd => !hidden.includes(cmd.data.name))
      .forEach(cmd => {
        embed.addFields({
          name: `/${cmd.data.name}`,
          value: cmd.data.description,
          inline: false
        });
      });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
