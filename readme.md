# DeepHomieJS
## Deep Homie is a discord bot with music functionality and inside jokes
+ *Thanks dad bot*
+ *Pogs with you*
+ *Knows when he was called*
+ *Congratulates you*
+ *Makes sure you are always in the right channel*
+ **And 🦀MORE🦀**

### Supports youtube searches and links and soon to support spotify

### Required libraries:
+ discordjs
+ @discordjs/voice and dependencies
+ play-dl
+ he
+ fetch

### To use:
+ First run authorization.js and grab your youtube cookie. (For more information see play-dl documentation)
+ Second, create a node config.json file with the format:
```
{
	"token": "Discord bot token",
    "clientId": "Discord client ID",
    "apiKey": "Youtube API key"
}
```
+ Third, run node deply-commands.js
+ FInally run node index.js and your bot should be online