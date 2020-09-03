const Discord = require('discord.js');
const bot = new Discord.Client();

const token = "NzUwODMzNDIxMjUyNjg5OTMw.X1ASHQ.nJbsqOHxstiBKcNiOtfhMQTyL-k";

const PREFIX = '-';

bot.login(token)

bot.on('ready', () =>{
    console.log('I am alive!')
})

bot.on('message', message=>{
    var prefix = message.content.substring(0, PREFIX.length);
    if(prefix.startsWith(PREFIX)) {
        if(message.content != "") {
            let args = message.content.substring(PREFIX.length).split(" ");

            switch (args[0]) {
                case "ping":
                    message.channel.send("pong");
                    break;
            
                default:
                    break;
            }
        }
    }
})

