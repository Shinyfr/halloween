// commands/buy.js
const { SlashCommandBuilder }             = require('@discordjs/builders');
const { EmbedBuilder }                    = require('discord.js');
const shop = require('../shop.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Achète un article de la boutique')
    .addStringOption(opt =>
      opt.setName('item')
         .setDescription('ID de l’article')
         .setRequired(true)
    ),
  async execute(interaction) {
    const db    = interaction.client.db;
    const uid   = interaction.user.id;
    const choice= interaction.options.getString('item');
    const prod  = shop.find(i => i.id === choice);

    if (!prod) {
      return interaction.reply({ content: '❌ Article introuvable.', ephemeral: true });
    }

    const balance = await db.get(`${uid}_balance`) || 0;
    if (balance < prod.price) {
      return interaction.reply({
        content: `❌ Il te manque **${prod.price - balance}** 🍬 pour acheter **${prod.name}**.`,
        ephemeral: true
      });
    }

    // Transaction
    await db.set(`${uid}_balance`, balance - prod.price);
    const inv = await db.get(`${uid}_inv`) || [];
    inv.push(prod.id);
    await db.set(`${uid}_inv`, inv);

    // Embed de confirmation
    const embed = new EmbedBuilder()
      .setTitle(`✅ Achat réussi !`)
      .setColor('#00FF00')
      .addFields(
        { name: 'Article', value: prod.name, inline: true },
        { name: 'Coût',    value: `${prod.price} 🍬`, inline: true },
        { name: 'Solde restant', value: `${balance - prod.price} 🍬`, inline: true }
      )
      .setFooter({ text: `Merci pour ton achat !` });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
