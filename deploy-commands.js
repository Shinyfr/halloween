require('dotenv').config();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Actualisation des commandes slash...');
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,    // Ton Application ID
        process.env.GUILD_ID      // ID du serveur de test
      ),
      { body: commands },
    );
    console.log('Commandes enregistrées.');
  } catch (error) {
    console.error(error);
  }
})();
