// Require the necessary discord.js classes
const { Client } = require('discord.js');
const { token} = require('./config.json');
const { Collection } = require('discord.js');
const path = require('node:path');
const fs = require('node:fs');
const playCommand = require('./commands/play.js');

// Create a new client instance
const client = new Client({ 
	intents: ['DirectMessages', 'DirectMessageReactions', 'GuildMessages', 'GuildMessageReactions', 'Guilds', 'MessageContent', 'GuildVoiceStates']
 });
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
// console.log(commandsPath);
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
	// console.log(command.data.name);
}
client.on('interactionCreate', async interaction => {
	// console.log("test");
	if (!interaction.isChatInputCommand()/* && !interaction.isButton()*/) return;
	// if(interaction.isChatInputCommand()){
		const command = interaction.client.commands.get(interaction.commandName);
		if (!command) return;

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			try{
				await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });

			}
			catch{
				// await interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true })
			}
		}
});
client.on('interactionCreate', async interaction => {
	if(!interaction.isButton()){ return} else{
		// console.log(interaction);
		let guildId = interaction.guildId;
		playCommand.deleteInteraction(guildId);
		// Delete the previous interaction, by holding onto the interaction that was most recently used I can reliably delete the buttons after they are
		// No longer required.
		// This will need to be expanded out if I ever add more button based commands but for now this will be good enough, no sense overcomplicating things
		let items = interaction.component.customId.toString().split('|');
		let link = items[0];
		let title = items[1];

		voicePlayer.addToQueue(link, interaction.guild, title);
		interaction.reply(`Added ${title} to queue`);
	}
	
});
	
	
const {isTextEnabled} = require('./voicePlayer');
const { generateDependencyReport } = require('@discordjs/voice');
const voicePlayer = require('./voicePlayer');

const textCommands = [];
const textCommandsPath = path.join(__dirname, 'textCommands');
const textCommandsFiles = fs.readdirSync(textCommandsPath).filter(file => file.endsWith('.js'));
for (const file of textCommandsFiles){
	const filePath = path.join(textCommandsPath, file);
	const command = require(filePath);
	textCommands.push(command);
}
client.on('messageCreate', async message => {
	// Later I need to figure out how to turn this into multiple files if possible
	if(message.author.id == client.application.id){
		return;
	}
	// console.log(isTextEnabled());
	
	if(isTextEnabled(message.guild.id)){
		// Put in the commands here
		textCommands.forEach(command => {
			if(command.Test(message)){
				// Adding this allows me to use multiple files finally.
				return false;
				// Stop looking if we found one that does not allow other commands as well.
			}
		});
	}
})
// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
});
function getYoutubeId(url){
    var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\/|shorts\/|\?v=|\&v=|\?v=)([^#\&\?]*).*/;
    return url.match(regExp)[2];
}
// Login to Discord with your client's token
console.log(generateDependencyReport());

client.login(token);
