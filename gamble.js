module.exports =  {
    run: function gamble(message, args) {
        const economy = require("./index.js")
        /*rolls 2 die for both the player and the bot, highest score wins
        Winnings are 2 * bet */
        let UID = message.author.id;
        let checkBal = economy.checkBalance(UID, args[1], message); //validates that user actually has bet amount
        if(checkBal['minimumCheck']) {
            //play game
            let playerName = message.author.username;
            let playerScore = rollDie(6) + rollDie(6);
            let botScore = rollDie(6) + rollDie(6);
            let gameResult = playerScore > botScore;
            let gambleAmount = checkBal['amount'];
            let winnings = economy.calculateWinnings();
            let description = "";

            //add/deduct money
            if(gameResult) { 
                description = "You won **" + winnings + "** coins.";
                economy.depositWallet(message.author.id, winnings); 
            }
            else { 
                description = "You lost **" + gambleAmount + "** coins.";
                economy.withdrawWallet(message.author.id, gambleAmount);
            }

            //display results to user
            let title = "**" + message.author.username + "'s gambling game**";
            description += "\nYou now have **" + userData[UID].walletBalance + "** coins.\n\n" +
            "**" + playerName + "** Rolled ``" + playerScore + "``\n" +
            "**" + BOT_NAME + "** Rolled ``" + botScore + "``";
            message.channel.send(economy.createEmbed(title, description));
        }
    }
}