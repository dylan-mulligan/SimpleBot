const Discord = require('discord.js');
const bot = new Discord.Client();

const token = "";

const PREFIX = '-';
const HELPMSG = "Invalid Arguments, use -help <command> for help"

const chatCommands = require('./chatCommands.js');

bot.login(token)

bot.on('ready', () =>{
    console.log('I am alive!')
})

bot.on('message', message=>{
    const sharkPogEmbed = new Discord.MessageEmbed()
    .setTitle("Shark Pog :shark:")
    .setDescription("[Shark Pog](https://www.youtube.com/watch?v=cR3sT2ieGd0) :shark:")
    .setURL("https://www.youtube.com/watch?v=cR3sT2ieGd0")
    .setThumbnail("https://pbs.twimg.com/media/Edk4ljAWoAAM4Ww.jpg")
    .addField("Shark Pog :shark:", "[Shark Pog](https://www.youtube.com/watch?v=cR3sT2ieGd0) :shark:")
    .setFooter("Shark Pog", "https://pbs.twimg.com/media/Edk4ljAWoAAM4Ww.jpg")
    .setAuthor("Shark Pog :shark:","","https://www.youtube.com/watch?v=cR3sT2ieGd0")

    if(message.author.id !== "750833421252689930") {
        if(message.content.search("shark") !== -1 || message.content.search("pog") !== -1) {
            message.reply("Shark Pog :shark:");
            message.channel.send(sharkPogEmbed);
            message.channel.send("https://www.youtube.com/watch?v=cR3sT2ieGd0 :shark:");
        }
        var prefix = message.content.substring(0, PREFIX.length);
        if(prefix.startsWith(PREFIX)) {
            if(message.content != "") {
                let args = message.content.substring(PREFIX.length).split(" ");
                let messageOutput = "";
                /*
                const embed = new Discord.MessageEmbed()
                .setTitle("Sample Title")
                .setColor(0xff0000)
                .setDescription("Sample Description")
                .setURL("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
                */
    
                switch (args[0]) {
                    case "ping":
                        messageOutput = "pong";
                        break;
                    case "roll":
                        if(args[1] && !isNaN(args[1])) {
                            let roll = "Your Roll: ";
                            let rNum = parseInt(args[1]);
                            console.log(rNum);
                            for(let i = 0; i < rNum; i++) {
                                roll += randomNumber(1,6) + " ";
                            }
                            messageOutput = roll;
                        }
                        else {messageOutput = null;}
                        break;
                    case "clear":
                        if(args[1] && !isNaN(args[1]) && args[1] > 0) {
                            message.channel.bulkDelete(args[1]);
                            message.channel.send("Cleared " + args[1] + " messages.")
                            return;
                        }
                        else {
                            message.reply(HELPMSG);
                        }
                        break;
                    case "embed":
                        message.channel.send(embedVideo("Title", "Find the video [here](https://www.youtube.com/watch?v=_0QrvLcL-ng)", "https://www.youtube.com/watch?v=_0QrvLcL-ng", "https://www.youtube.com/watch?v=_0QrvLcL-ng"))
                    case "help":
                        break;
                    default:
                        break;
                }
    
                if(messageOutput) {
                    message.channel.send(messageOutput);
                    return;
                }
                else if(messageOutput === null) {
                    message.reply(HELPMSG);
                }
                
            }
        }
    }
})

function randomNumber(min, max) {  
    return Math.round(Math.random() * (max - min) + min); 
}

function embedVideo(videoTitle, videoDescription, videoURL, videoThumbnailURL) {
    let embed = new Discord.MessageEmbed()
    .setTitle(videoTitle)
    .setDescription(videoDescription)
    .setImage(videoThumbnailURL)
    .setURL(videoURL);
    return embed
}


