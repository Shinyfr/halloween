const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Répond pong !'),
  async execute(interaction) {
    await interaction.reply('pong 🏓');
  },
};
