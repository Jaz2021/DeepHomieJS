const { SlashCommandBuilder } = require("discord.js");
const serverTimer = require('../serverTimer.js');
module.exports = {
    data: new SlashCommandBuilder()
    .setName('force_server_status')
    .setDescription('Manually set the server to online after the bot crashes')
    .addIntegerOption(option => option.setName('time').setDescription('How much time to keep online.').setRequired(true))
    .addIntegerOption(option => option.setName('server').setDescription("Which server to add time to").addChoices({name: "vault_hunters", value: 0}, {name: "create_astral", value: 1}, {name: "vanilla", value: 2}).setRequired(true))
    .addIntegerOption(option => option.setName('unit').setDescription('Whether you are adding minutes, or hours. (Default: minutes)').addChoices({name: "minutes", value: 1}, {name: "hours", value: 60})),
    async execute(interaction){
        let server = "";
        serverInt = interaction.options.getInteger('server');

        if(serverInt == 0){
            server = "vault";
        } else if(serverInt == 1){
            server = "create";
        } else {
            server = "vanilla";
        }
        let unit = (interaction.options.getInteger('unit') == 60) ? 'hours' : 'minutes';2
        let unitMult = (interaction.options.getInteger('unit') == 60) ? 60 : 1;
        serverTimer.forceServerStatus(interaction.options.getInteger('time') * unitMult, server)
        interaction.reply(`Force updated ${server} with ${interaction.options.getInteger('time')} ${unit}`);
        

    }
}