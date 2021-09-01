const economy = require("./economy")
const utils = require("./utils")

function blackjack(userData, botName, minBet, message, args) {
    /*draws 2 cards for both the player and the bot, player is offered hit/stand,
    bot plays until score > 16
    Winnings are 2 * bet */
    let UID = message.author.id;
    let checkBal = economy.checkBalance(userData, minBet, UID, args[1], message); //validates that user actually has bet amount
    if(checkBal['minimumCheck']) { //check that user has amount they try to bet
        let gameResult = null; //inital game result value (stays null in case of tie)
        let deck = utils.createDeck(); //generate and store fresh deck of cards
        let playerName = message.author.username; //store player's name
        let playerHand = utils.drawCard(deck, 2); //draws 2 cards for the player
        let botHand = utils.drawCard(deck, 2); //draws 2 cards for the bot

        //score hands
        let playerScore = scoreHand(playerHand);
        let botScore = scoreHand(botHand);

        while (true) { //offer hit/stand until user stands or busts
            //offer choice
            //if choice == stand: break;

            if(playerScore > 21) { //if player busts
                gameResult = false;
                break;
            }
        }
        
        if(gameResult != null) { //if player has not busted play bot hand
            while (true) {
                if(botScore <= 16) { //bot (dealer) must hit on <= 16
                    botHand.push(utils.drawCard(deck, 1)); //put new card in botHand
                    botScore = scoreHand(botHand); //rescore with new card added to botHand
                }
                else { break; } //bot (dealer) must stand on >= 17, break
                if(botScore > 21) { //if bot busts, set gameResult and break
                    gameResult = true;
                    break;
                }
            }
        }

        if(gameResult == null) { //if game result == null (neither player nor bot busted)
            //compact game logic, sets gameResult T/F unless player and bot tie (gameResult remains null)
            if(botScore != playerScore) { gameResult = playerScore > botScore ? true : false }
        }


        let gambleAmount = checkBal['amount']; //store amount of coins gambled to calculate winnings
        let winnings = gambleAmount; //winnings (profits) = inital bet
        let description = ""; //game embed description variable

        //determine result of game, inform player and deposit/withdraw coins
        if(gameResult == null) { //tie
            description = "Tie, you were refunded your bet of **" + winnings + "** coins.";
        }
        else if(gameResult) { //player win
            description = "You won **" + winnings + "** coins.";
            economy.depositWallet(userData, message.author.id, winnings); 
        }
        else { //bot win
            description = "You lost **" + gambleAmount + "** coins.";
            economy.withdrawWallet(userData, message.author.id, gambleAmount);
        }

        //display results to user
        let title = "**" + message.author.username + "'s blackjack game**";
        description += "\nYou now have **" + userData[UID].walletBalance + "** coins.\n\n" +
        "**" + playerName + "** Rolled ``" + playerHand + "``\n" +
        "**" + botName + "** Rolled ``" + botHand + "``";
        message.channel.send(utils.createEmbed(title, description));
    }
}

function scoreHand(hand) {
    let score = 0;
    let cardValue = 0;
    hand.forEach(card => {
        cardValue = parseInt(c.slice(1)); //splice card value out of card string
        try { score += cardValue == 1 ? 11 : cardValue; } catch (error) {} //add card value to score (1 = Ace, replaced with 11)
    });
    return score;
}

module.exports = { blackjack }