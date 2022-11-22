const {SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder} = require('discord.js');
const { apiKey } = require('../config.json');
const he = require('he');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const voicePlayer = require('../voicePlayer');
var buttonInteraction = {};
var buttonTimedOut = {};
module.exports = {
    data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play\'s music from youtube')
    .addStringOption(option => option.setName('searchlink').setDescription('Whether you are doing a youtube link or youtube search').addChoices({name: 'Search', value: 'search'} , {name: 'Youtube Link', value: 'link'}).setRequired(true))
    .addStringOption(option => option.setName('term').setDescription('The search term or the link to the video').setRequired(true))
    .addChannelOption(option => option.setName('voicechannel').setDescription('The voice channel to join'))
    ,

    async execute(interaction){
        // console.log("Hello");
        let gotVoiceChannel = interaction.options.getChannel('voicechannel');
        if(gotVoiceChannel != null){
            // console.log(gotVoiceChannel.type);
            if(gotVoiceChannel.type != 2){
                // console.log("reply1");
                await interaction.reply({content: 'That was not a voice channel, please try again', ephemeral: true});
                return;
            }
        } else {
           
            gotVoiceChannel = interaction.member.voice.channel;
            // console.log(interaction.member.voice);
            if(gotVoiceChannel == null){
                // console.log('B');
                await interaction.reply({content: 'You are not currently in a voice channel, please join one or specify the channel and try again'});
                

                return;
            }

        }
        if(interaction.options.getString('searchlink') == 'search'){
            // Find the results from the youtube API
            await interaction.deferReply();
            const keywords = interaction.options.getString('term');
            const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&type=video&part=snippet&maxResults=5&q=${keywords}`;
            const response = await fetch(url);
            // console.log("Response:");
            let results = await response.json();
            //Bring it into a json to be easily usable
            
            let fields = [];
            let buttonItems = [];
            let num = 0;
            if(results["items"] != null){
                results["items"].forEach(element => {
                    //Make a dynamic list of fields and buttons, button ID will be the video link
                    //Max out the number as 5, this is the max buttons discordJS allows anyways
                    if(num < 5){
                        fields.push({name: `Option ${num + 1}`, value: `Title: ${he.decode(results["items"][num]['snippet']['title'])}\nChannel: ${he.decode(results["items"][num]['snippet']['channelTitle'])}`});
                        let id = `https://www.youtube.com/watch?v=${results["items"][num]["id"]["videoId"]}|${he.decode(results["items"][num]['snippet']['title'])}`;
                        let trimmedString = id.length > 100 ? 
                            id.substring(0, 96) + "..." : 
                            id;
                            // If string is greater than 100 characters long, trim it to size
                        buttonItems.push(new ButtonBuilder().setCustomId(trimmedString).setLabel((num + 1).toString()).setStyle(ButtonStyle.Primary))
                    }
                    num += 1;
                });
                const embed = await new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle('Search Results:')
                        .addFields(
                            fields // Use that dynamic list
                        )
                const buttons = new ActionRowBuilder()
                        .addComponents(
                            buttonItems // Use Dynamic list again
                        );
                    // console.log('C');
                this.setInteraction(interaction.guild.id, interaction);
                await interaction.editReply({embeds: [embed] , components: [buttons]}); //Send the embed with buttons
                // const collector = interaction.channel.createMessageComponentCollector({time: 15000});
                // collector.on('collect', async i => {
                //     await i.update({content: 'Timed out', components: []});
                // });
    
                
                this.JoinVoiceChannel(gotVoiceChannel);
                return;
            } else {
                // await sleep(1000);
                await interaction.editReply({content: "Something went wrong and the search failed. Most likely, I ran out of API requests, please try again later.", ephemeral: true});
                return;
            }
            
        } else if(interaction.options.getString('searchlink') == 'link'){
            if(validateYouTubeUrl(interaction.options.getString('term'))){
                await interaction.deferReply();
                // console.log(getYoutubeId(interaction.options.getString('term')));
                await this.JoinVoiceChannel(gotVoiceChannel);
                const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&part=snippet&id=${getYoutubeId(interaction.options.getString('term'))}`);
                const jsonVal =  await response.json();
                // console.log(`https://www.googleapis.com/youtube/v3/search?key=${apiKey}&type=video&part=snippet&q=${getYoutubeId(interaction.options.getString('term'))}`);

                // voicePlayer
                // console.log('D');
                // console.log(`https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&part=snippet&id=${getYoutubeId(interaction.options.getString('term'))}`)
                // console.log(jsonVal);
                if(jsonVal["items"] != null){
                    // console.log(jsonVal["items"]);
                    voicePlayer.addToQueue(interaction.options.getString('term'), interaction.guild, he.decode(jsonVal["items"][0]["snippet"]["title"]));

                    await interaction.editReply(`Added ${he.decode(jsonVal["items"][0]["snippet"]["title"])} to the queue`);

                } else {
                    voicePlayer.addToQueue(interaction.options.getString('term'), "No title, out of API requests");

                    await interaction.editReply('Added to queue (Out of API requests, no title)');
                }

                return;
            } else {
                await interaction.reply({content: "That was an invalid link, only youtube links are currently supported", ephemeral: true});
                return;
            }
            
            
        }
        // V Not yet implemented V
        // if(!voicePlayer.isConnected()){
        //     voicePlayer.setConnection(voiceChannelId, interaction.guild.id, interaction.guild.voiceAdapterCreator);
        // }
        
        
    },
    async JoinVoiceChannel(voiceChannel){
        // console.log(voiceChannel.guild.voiceAdapterCreator);
        await voicePlayer.setConnection(voiceChannel);
        // voicePlayer.
    },
    deleteInteraction(guildId){
        // console.log(`Tried to delete interaction for ${guildId}`);
        if(buttonInteraction[guildId] != null){
            buttonInteraction[guildId].editReply({components: []});
            buttonInteraction[guildId] = null;
            buttonTimedOut[guildId] = 0;
        }
    },
    async setInteraction(guildId, interaction){
        if(buttonTimedOut[guildId] == null){
            buttonTimedOut[guildId] = 0;
            // Count the number of timeouts it needs before it should be deleted
        }
        buttonTimedOut[guildId]++;
        if(buttonInteraction[guildId] != null){
            this.deleteInteraction(guildId)
        }
        buttonInteraction[guildId] = interaction;
        
        await sleep(15000);
        buttonTimedOut[guildId]--;
        // console.log(buttonTimedOut[guildId]);
        if(buttonTimedOut[guildId] <= 0){
            this.deleteInteraction(guildId);
            // If it ran out of timeouts, delete it
            buttonTimedOut[guildId] = 0;
        }
    }
}
function validateYouTubeUrl(url)
{
    if (url != undefined || url != '') {
        var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\/|shorts\/|\?v=|\&v=|\?v=)([^#\&\?]*).*/;
        var match = url.match(regExp);
        if (match && match[2].length == 11) {
            
            return true;
            // Do anything for being valid
            // if need to change the url to embed url then use below line
            // $('#ytplayerSide').attr('src', 'https://www.youtube.com/embed/' + match[2] + '?autoplay=0');
            
        }
        // console.log(match[2]);
    }
    return false;
}
function getYoutubeId(url){
    var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\/|shorts\/|\?v=|\&v=|\?v=)([^#\&\?]*).*/;
    return url.match(regExp)[2];
}
function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}
