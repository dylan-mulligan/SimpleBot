const utils = require("./utils")

function roll(message, args) { //rolls given amount of 6-sided die and displays them to the user
    let roll = "Your Roll: **";
    let rNum = parseInt(args[1]);
    let title = "**" + message.author.username + "'s Roll**";
    let description = "\n"
    if(rNum > 0 && rNum < 20) {
        for(let i = 0; i < rNum; i++) {
            roll += utils.rollDie(6) + " ";
        }
        description = roll + "**"
        message.channel.send(utils.createEmbed(title, description));
        return;
    }
    else { message.channel.send("Please enter a valid number of die (1-20)!"); return; }
}

module.exports = { roll }