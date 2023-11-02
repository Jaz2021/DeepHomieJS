






const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes, SystemChannelFlagsBitField } = require('discord.js');
const { token, clientId } = require('./config.json');
// const token = "dPLKKelm2FNK_R3MvEpTKpYrUSbfYd20";
// const clientId = "822914183007830066";
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    commands.push(command.data.toJSON());
}
    

const rest = new REST({ version: '10' }).setToken(token);
// Hello there
rest.put(
    Routes.applicationCommands(clientId),
    {body: commands},
);
