// commands/help.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder }        = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Affiche la liste des commandes disponibles'),
  async execute(interaction) {
    const commands = interaction.client.commands;
    const embed = new EmbedBuilder()
      .setTitle('🤖 Aide des commandes')
      .setColor('#00AAFF')
      .setDescription('Voici la liste des commandes disponibles :');

    commands.forEach(cmd => {
      embed.addFields({
        name: `/${cmd.data.name}`,
        value: cmd.data.description,
        inline: false
      });
    });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
