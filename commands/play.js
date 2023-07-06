const {SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, InteractionCollector} = require('discord.js');
const { apiKey } = require('../config.json');
const he = require('he');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const play = require('play-dl');
const voicePlayer = require('../voicePlayer');
var buttonInteraction = {};
var buttonTimedOut = {};
play.getFreeClientID().then((clientID) => {
    play.setToken({
      soundcloud : {
          client_id : clientID
      }
    })
})
module.exports = {
    data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play\'s music from youtube')
    // .addStringOption(option => option.setName('source').setDescription('Youtube or Spotify').addChoices({name: 'Youtube', value: 'youtube'} , {name: 'Spotify', value: 'spotify'}).setRequired(true))
    .addStringOption(option => option.setName('term').setDescription('The search term or the link to the video').setRequired(true))
    .addIntegerOption(option => option.setName('seek').setDescription('The number of seconds to skip forward in the video (0 default)'))
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
        // console.log(await play.validate((interaction.options.getString('term'))));
        let source = await play.validate(interaction.options.getString('term'));
        await interaction.deferReply();
        let seek = 0;
        if(interaction.options.getInteger("seek") != null){
            seek = interaction.options.getInteger("seek");
        }
        if(source.includes('yt')){
            // Check if the term is a link
            let term = interaction.options.getString('term');
            // If a link 
            // console.log(getYoutubeId(interaction.options.getString('term')));
            await this.JoinVoiceChannel(gotVoiceChannel);
            // Join the channel
            const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&part=snippet&id=${getYoutubeId(interaction.options.getString('term'))}`);
            // grab the video data
            const jsonVal =  await response.json();
            // bring it into json
            // console.log(`https://www.googleapis.com/youtube/v3/search?key=${apiKey}&type=video&part=snippet&q=${getYoutubeId(interaction.options.getString('term'))}`);

            // voicePlayer
            // console.log('D');
            // console.log(`https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&part=snippet&id=${getYoutubeId(interaction.options.getString('term'))}`)
            // console.log(jsonVal);
            if(jsonVal["items"] != null){
                // Make sure I can look at the data
                // console.log(jsonVal["items"]);
                voicePlayer.addToQueue(interaction.options.getString('term'), interaction.guild, he.decode(jsonVal["items"][0]["snippet"]["title"]), seek);
                // Add the item to the queue and set the title

                await interaction.editReply(`Added ${he.decode(jsonVal["items"][0]["snippet"]["title"])} to the queue`);

            } else {
                voicePlayer.addToQueue(interaction.options.getString('term'), "No title, out of API requests", seek);

                await interaction.editReply('Added to queue (Out of API requests, no title)');
            }

            return;
        } else if(source == 'search'){// Find the results from the youtube API
            const keywords = interaction.options.getString('term');
            const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&type=video&part=snippet&maxResults=5&q=${keywords}`;
            console.log(url);
            const response = await fetch(url);
            // console.log("Response:");
            let results = await response.json();
            //Bring it into a json to be easily usable
            
            let fields = [];
            let buttonItems = [];
            let num = 0;
            if(results["items"] != null && results["items"].length > 0){

                results["items"].forEach(element => {
                    //Make a dynamic list of fields and buttons, button ID will be the video link
                    //Max out the number as 5, this is the max buttons discordJS allows anyways
                    if(num < 5){
                        let title = he.decode(results["items"][num]['snippet']['title']);
                        let trimmedTitle = title; 
                        if(title.length > 50){
                            trimmedTitle = title.substring(0, 46) + "...";
                        }
                        let trimmedChannel = he.decode(results["items"][num]['snippet']['channelTitle'])
                        if(trimmedChannel.length > 50){
                            trimmedChannel = trimmedChannel.substring(0, 46) + "...";
                        }
                        
                        fields.push({name: `Option ${num + 1}`, value: `Title: ${trimmedTitle}\nChannel: ${trimmedChannel}`});

                        let id = `https://www.youtube.com/watch?v=${results["items"][num]["id"]["videoId"]}|${title}`;
                        let trimmedString = id; 
                        if(id.length > 100){
                            trimmedString = id.substring(0, 96) + "...";
                        }
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
                await interaction.editReply("No results found");
                return;
            }

        } else if(source.includes('sp')){
            await interaction.editReply("Spotify is not currently supported, please find a track on Youtube or Soundcloud instead");
            return;
        } else if(source.includes('so')){
            let sound = await play.soundcloud(interaction.options.getString('term'));
            await interaction.editReply(`Now playing: ${sound.name}`);
            this.JoinVoiceChannel(gotVoiceChannel);
            voicePlayer.addToQueue(interaction.options.getString('term'), interaction.guild, sound.name, seek);
            return;

        } else if(source.includes('dz')){
            await interaction.editReply("Deezer is not currently supported, please find a track on Youtube or Soundcloud instead");
            return;
        }
        interaction.editReply('Unknown source');
        return;
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
        
        await sleep(30000);
        buttonTimedOut[guildId]--;
        // console.log(buttonTimedOut[guildId]);
        if(buttonTimedOut[guildId] <= 0){
            this.deleteInteraction(guildId);
            // If it ran out of timeouts, delete it
            buttonTimedOut[guildId] = 0;
        }
    }
}
function getYoutubeId(url){
    var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\/|shorts\/|\?v=|\&v=|\?v=)([^#\&\?]*).*/;
    return url.match(regExp)[2];
}
function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}