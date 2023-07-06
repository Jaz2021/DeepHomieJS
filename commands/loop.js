const {SlashCommandBuilder} = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Loop the current playlist')
    .addIntegerOption(option => option.setName('count').setDescription('The number of times to loop')),
    async execute(interaction){
        
        await interaction.reply('Not yet implemented!');
    }
};