






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
const modulesPath = path.join(__dirname, "modules")
const modulesFolders = fs.readdirSync(modulesPath).filter(file => !file.endsWith(".txt"))
// console.log(modulesFolders)
console.log("--------------------------------------------------")
for (const folder of modulesFolders){
    const folderPath = path.join(modulesPath, folder)
    // console.log(folderPath)
    const cmdPath = path.join(folderPath, "commands")
    let moduleCommands = fs.readdirSync(cmdPath).filter(file => file.endsWith(".js"))
    // Check for any commands within the commands subfolder in the module
    // console.log(moduleCommands)
    const initPath = path.join(modulesPath, folder,  "init.js")
    const initCmd = require(initPath)
    initCmd.init();
    for (const cmd of moduleCommands){
        // console.log(cmd)
        const filePath = path.join(folderPath, "commands", cmd)
        const command = require(filePath)
        commands.push(command.data.toJSON())
    }
    
}
console.log("--------------------------------------------------")



async () => {
    const rest = await new REST({ version: '10' }).setToken(token);
    rest.put(
    Routes.applicationCommands(clientId),
    {body: commands},
);}
console.log("Successfully deployed commands")

