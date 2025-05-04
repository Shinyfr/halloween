// commands/story.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const scenarios = require('../scenario.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('story')
    .setDescription('Histoire du jour'),
  async execute(interaction) {
    const now = new Date();
    const key = `${now.getMonth()+1}-${now.getDate()}`;
    const text = scenarios[key] || 'Rien à signaler…';
    await interaction.reply(text);
  }
};
