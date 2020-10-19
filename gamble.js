const economy = require("./economy")
const utils = require("./utils")

function gamble(userData, botName, minBet, message, args) {
    /*rolls 2 die for both the player and the bot, highest score wins
    Winnings are 2 * bet */
    let UID = message.author.id;
    let checkBal = economy.checkBalance(userData, minBet, UID, args[1], message); //validates that user actually has bet amount
    if(checkBal['minimumCheck']) {
        //play game
        let playerName = message.author.username;
        let playerScore = utils.rollDie(6) + utils.rollDie(6);
        let botScore = utils.rollDie(6) + utils.rollDie(6);
        let gameResult = playerScore > botScore;
        let gambleAmount = checkBal['amount'];
        let winnings = economy.calculateWinnings(gambleAmount);
        let description = "";

        //add/deduct money
        if(gameResult) { 
            description = "You won **" + winnings + "** coins.";
            economy.depositWallet(userData, message.author.id, winnings); 
        }
        else { 
            description = "You lost **" + gambleAmount + "** coins.";
            economy.withdrawWallet(userData, message.author.id, gambleAmount);
        }

        //display results to user
        let title = "**" + message.author.username + "'s gambling game**";
        description += "\nYou now have **" + userData[UID].walletBalance + "** coins.\n\n" +
        "**" + playerName + "** Rolled ``" + playerScore + "``\n" +
        "**" + botName + "** Rolled ``" + botScore + "``";
        message.channel.send(utils.createEmbed(title, description));
    }
}

module.exports = { gamble }