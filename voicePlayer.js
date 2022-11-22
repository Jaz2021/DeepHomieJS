const { SelectMenuOptionBuilder } = require('@discordjs/builders');
const {VoiceConnectionStatus, entersState, createAudioPlayer, getVoiceConnection, joinVoiceChannel, createAudioResource, NoSubscriberBehavior, AudioPlayerStatus, AudioResource} = require('@discordjs/voice');
const ytdl = require('ytdl-core');
// const fs = require('fs');
// const path = require('node:path');
// const play = require('./commands/play');

var textEnabled = new Object();
var queue = new Object();
var skipping = false;
module.exports = {
    async setConnection(voiceChannel){
        let channel = voiceChannel.id;
        let guild =  voiceChannel.guildId;
        let adapter = voiceChannel.guild.voiceAdapterCreator;
        let connection = joinVoiceChannel({
                channelId: channel,
                guildId: guild,
                adapterCreator: adapter,
                selfDeaf: true
            })
            //I honestly have no idea if this works the way i think it does
            connection.on(VoiceConnectionStatus.Disconnected, async(oldState, newState) => {
            try {
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                    enterState(connection, VoiceConnectionStatus.Signalling, 5_000),
                ])
            } catch (error){
                connection.destroy();
                console.log("Connection destroyed");
            }
        })
    
    },
    async addToQueue(vidLink, guild, name){
        // var connection = getVoiceConnection(guild.id);
        let PlayAtEnd = false;
        if(!queue.hasOwnProperty(guild.id)){
            var player = await createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Pause    
                    }
                }
            );
            queue[guild.id] = {current: 0, audioPlayer: player, resource: [], paused: false, items: [], looping: false};
            await getVoiceConnection(guild.id).subscribe(queue[guild.id]["audioPlayer"]);
            queue[guild.id]["audioPlayer"].on('error', error => {
                console.error(`Error: ${error.message} with resource ${error.resource}`);
            });
            queue[guild.id]["audioPlayer"].on("stateChange", (stream) =>{
                if(stream.resource !== undefined){
                    if(stream.resource["ended"] && !skipping){
                        // console.log("Stream has ended, onto next");
                        this.skipInQueue(guild,1);
                    }
                }
                
                // console.log(stream.resource);
            });
            PlayAtEnd = true;
        } else if(queue[guild.id] == null){
            // This should not be necessary but just in case
            var player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Play    
                    }
                }
            );
            queue[guild.id] = {current: 0, audioPlayer: player, resource: [], paused: false, items: [], looping: false};
            // If this is the first item, subscribe the voice connection to the audioPlayer
            await getVoiceConnection(guild.id).subscribe(queue[guild.id]["audioPlayer"]);
            queue[guild.id]["audioPlayer"].on('error', error => {
                console.error(`Error: ${error.message} with resource ${error.resource}`);
            });
            queue[guild.id]["audioPlayer"].on("stateChange", (stream) =>{
                // console.log(stream.resource["ended"]);
                if(stream.resource !== undefined){
                    if(stream.resource["ended"] && !skipping){
                        // console.log("Stream has ended, onto next");
                        this.skipInQueue(guild, 1);
                    }
                }
                
                // console.log(stream.resource);
            });
            PlayAtEnd = true;

        }

        queue[guild.id]["items"].push({title: name, link: vidLink});
        // Add the video link and title to the items to be able to be grabbed by the nowPlaying command
        let vid = ytdl(vidLink, {filter: 'audioonly', dlChunkSize: 0, highWaterMark: 1 << 30});
        //Download the video, idk what highwatermark does but it was something necessary to make this work.
        queue[guild.id]["resource"].push(createAudioResource(vid));


        if(PlayAtEnd){
            
            // await sleep(5000);
            queue[guild.id]["audioPlayer"].play(queue[guild.id]["resource"][0]);
            
            // console.log(queue[guild.id]["resource"][0]);

        }
        // queue[guild.id]["count"] += 1;
        // The total number of tracks that have been in the queue so far, increment it by 1
        
        


        

        
    },
    
    isConnected(guild){
        return getVoiceConnection(guild.id) === null;
    },
    currentChannelId(guild){
        return getVoiceConnection(guild.id).channelId;
    },
    setTextEnabled(enable, guildId){
        // I guess the textEnabled stuff uses guildId
        textEnabled[guildId] = enable;
    },
    isTextEnabled(guildId){
        // Why is this one guildId while the rest are guild?
        if(!textEnabled.hasOwnProperty(guildId)){
            textEnabled[guildId] = true;
        }
        return textEnabled[guildId];
    },
    StopQueue(guild){
        const connection = getVoiceConnection(guild.id);
        if(queue.hasOwnProperty(guild.id)){
            delete queue[guild.id];
        }
        if(connection != null){
            // connection.disconnect();
            connection.destroy();
        }
        // console.log(connection);
    },
    pauseQueue(guild, time){
        if(queue.hasOwnProperty(guild.id)){
            queue[guild.id]["paused"] = true;
            queue[guild.id]["audioPlayer"].pause();
            if(time > 0){
                setTimeout(() => {
                    
                    if(queue[guild.id]["paused"]){
                        // Make sure it is still paused

                        module.exports.resumeQueue(guild);
                    } 
                    

                }, time * 1000);
            }
        }
        
    },
    resumeQueue(guild){
        if(queue.hasOwnProperty(guild.id)){
            // console.log(queue[guild.id]["paused"]);
            if(queue[guild.id]["paused"]){
                
                // Only try to resume if it is paused
                queue[guild.id]["paused"] = false;
                // Make it not paused (Lower by one in case it is going to be )
                queue[guild.id]["audioPlayer"].unpause();
                // Unpause the player
            }
            
        }
    },
    getCurrentTrack(guild){
        // Make sure that there is a queue for the guild
        if(queue.hasOwnProperty(guild.id)){
            // Return the message we want to send, which gets the guild's queue's current track from items
            return `The current song is: ${queue[guild.id]["items"][queue[guild.id]["current"]]["title"]}, `;
        } else {
            return `There is no song playing right now`;
        }
    }, 
    skipInQueue(guild, num){
        if(queue.hasOwnProperty(guild.id)){
            // Always make sure there even is a queue for the guild
            if(num > 0){
                // Make sure the number to skip is at least 1
                console.log(`Skipping ${num} tracks`);
                skipping = true;
                // Increment current by num
                let current = queue[guild.id]["current"] + num;
                if(queue[guild.id]["looping"]){
                    let current = current % queue[guild.id]['items'].length;

                }
                if(queue[guild.id]["items"][current] === undefined){
                    // Check if there is an item if you increase by num
                    // If not stop the queue
                    stopQueue(guild);
                    // console.log("WHY DOES THIS HATE ME");
                    // Why is this not a function??
                    // If so stop the queue
                } else {
                    //Otherwise we need to delete those songs we skipped and set up a new audioResource
                    playTrack(current, guild);
                }
                skipping = false;
            }
            
        }
    }
}
function stopQueue(guild){
    const connection = getVoiceConnection(guild.id);
        if(queue.hasOwnProperty(guild.id)){
            delete queue[guild.id];
        }
        if(connection != null){
            // connection.disconnect();
            connection.destroy();
        }
        // console.log(connection);
}
// There should be no reason to keep this nvm
function playTrack(n, guild){
    
    if(queue[guild.id]["items"][n] !== undefined){
        // Make sure it exists
        queue[guild.id]["current"] = n;
        // Set the current track to it
        queue[guild.id]["audioPlayer"].play(queue[guild.id]["resource"][n]);
        // Play the resource that should have been saved
        if(!queue[guild.id]["looping"]){
                removeLastTrack(guild);
        }
    } else {
        // Otherwise stop the queue
        exports.StopQueue(guild);
        
    }
    
    
}
function removeLastTrack(guild){
    // queue[guild.id] = {current: 0, count: 0, audioPlayer: player, resource: null, paused: false, items: [], looping: false};
    // Remove all items prior to current...
    //Set the items for the guild to a spliced version of the array where items 0 through the current item are removed
    for(let i = 0; i < queue[guild.id]["current"]; i++){
        queue[guild.id]["items"].shift();
        queue[guild.id]["resource"].shift();
    }
    queue[guild.id]["current"] = 0;
    
    
}
// async function playNextTrack(guild){
//     if(queue.hasOwnProperty(guild.id)){
//         if(queue[guild.id]["items"][queue[guild.id]["current"] + 1] !== undefined){
//             let vidLink = queue[guild.id]["items"][queue[guild.id]["current"] + 1];
//             let vid = ytdl(vidLink, {filter: 'audioonly', dlChunkSize: 0, highWaterMark: 1 << 30});
//             let resource = createAudioResource(vid);
//             await sleep(100);
//             queue[guild.id]["audioPlayer"].play(resource);
//             queue[guild.id]["current"]++;
//             queue[guild.id]["resource"] = resource;
//             let current = queue[guild.id]["current"];
//             if(!queue[guild.id]["looping"]){
//                 // removeTrack(0, current, guild);
//                 // if the playlist is not looping, delete the tracks that have been passed
                
//             }
//         }
//     }
    
    
// }

function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}
// export {isTextEnabled}