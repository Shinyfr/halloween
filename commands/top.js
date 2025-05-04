const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder }        = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('top')
    .setDescription('Affiche le classement des meilleurs bonbons'),
  async execute(interaction) {
    const db = interaction.client.db;
    const keys = await db.keys();
    const balanceKeys = keys.filter(k => k.endsWith('_balance'));

    // Construit un tableau { uid, bal }
    const list = await Promise.all(
      balanceKeys.map(async key => {
        const uid = key.slice(0, -'_balance'.length);
        const bal = await db.get(key) || 0;
        return { uid, bal };
      })
    );

    // Trie par solde décroissant
    list.sort((a, b) => b.bal - a.bal);

    // Prend les 10 premiers
    const top10 = list.slice(0, 10);

    // Prépare l'embed
    const embed = new EmbedBuilder()
      .setTitle('🏆 Top 10 des bonbons')
      .setColor('#FFD700')
      .setDescription('Voici les plus gros collectionneurs de bonbons !');

    // Ajoute un champ par joueur
    for (let i = 0; i < top10.length; i++) {
      const { uid, bal } = top10[i];
      let tag = uid;
      try {
        const user = await interaction.client.users.fetch(uid);
        tag = user.tag;
      } catch (e) {
        // si l'utilisateur n'est pas fetchable, on garde l'ID
      }
      embed.addFields({
        name: `#${i + 1} – ${tag}`,
        value: `${bal} 🍬`,
        inline: false
      });
    }

    // Répond publiquement
    await interaction.reply({ embeds: [embed], ephemeral: false });
  }
};
