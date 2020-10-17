const Discord = require('discord.js');
const bot = new Discord.Client();
const fs = require('fs');

let token = getToken();
var userData = require('./data/user-data.json');

const PREFIX = '-';
const HELP_MESSAGE = "Invalid Arguments, use -help <command> for help"
const VERSION = "0.1";
const BOT_ID = "750833421252689930"
const MIN_AMOUNT = 500
const BOT_NAME = "SharkPog Bot"


console.log("Bot logging in...")
bot.login(token);


try { //TODO: PROPER TRY/CATCH FOR INVALID TOKEN
    bot.on('ready', () =>{
    console.log("Login successful!")
    }) 
}
catch { console.log("Login failed! Exiting..."); return }


bot.on('message', message=>{
    
    if(message.author.id !== BOT_ID) {
        //try { data = JSON.parse(fs.readFileSync('data/user-data.json', 'utf8')); }
        //catch(e) { console.log('Error:', e.stack); }
        
        var prefix = message.content.substring(0, PREFIX.length);
        if(prefix.startsWith(PREFIX)) {
            if(message.content !== "") {
                let args = message.content.substring(PREFIX.length).split(" ");
                if (!userData[message.author.id]) {
                    //userData[message.author.id] = createUser() //TODO
                }
                
                CLI(message, args)
            }
        }

        fs.writeFileSync("./data/user-data.json", JSON.stringify(userData, null, 2), console.error)
        //try { data = JSON.parse(fs.readFileSync('data/user-data.json', 'utf8')); }
        //catch(e) { console.log('Error:', e.stack); }

    }
})

function rollDie(sides) {
    return Math.round(Math.random() * sides);
}

function createEmbed(title, description, thumbnail=null, url=null) {
    let embed = new Discord.MessageEmbed()
    .setTitle(title)
    .setDescription(description)
    .setImage(thumbnail)
    .setURL(url);
    return embed
}

function getToken() {    
    try {
        let token = fs.readFileSync('../Tokens/SharkPogBot.txt', 'utf8');
        return token
    } 
    catch(e) {
        console.log('Error:', e.stack);
    }
}

function roll(message, args) {
    let roll = "Your Roll: ";
    let rNum = parseInt(args[1]);
    if(rNum > 0 && rNum < 20) {
        for(let i = 0; i < rNum; i++) {
            roll += rollDie(6) + " ";
        }
        message.reply(roll);
    }
    else {
        message.reply("Please enter a valid number of die (1-20)!");
    }
}

function gamble(message, args) {
    let UID = message.author.id;
    let checkBal = checkBalance(UID, args[1], message);
    if(checkBal['minimumCheck']) {
        //play game
        let playerName = message.author.username;
        let playerScore = rollDie(6) + rollDie(6);
        let botScore = rollDie(6) + rollDie(6);
        let gameResult = playerScore > botScore;
        let gambleAmount = checkBal['amount'];
        let winnings = calculateWinnings();
        let description = ""

        //add/deduct money
        if(gameResult) { 
            description = "You won **" + winnings + "** coins.";
            depositWallet(message.author.id, winnings); 
        }
        else { 
            description = "You lost **" + gambleAmount + "** coins.";
            withdrawWallet(message.author.id, gambleAmount);
        }

        //print
        let title = "**" + message.author.username + "'s gambling game**";
        description += "\nYou now have **" + userData[UID].walletBalance + "** coins.\n\n" +
        "**" + playerName + "** Rolled ``" + playerScore + "``\n" +
        "**" + BOT_NAME + "** Rolled ``" + botScore + "``";
        message.channel.send(createEmbed(title, description));
    }
    else {
        //TODO
    }
}

function checkBalance(UID, amount, message) {
    if(userData[UID] != null) {
        let maxAmount = userData[UID].walletBalance;
        amount = getAmount(amount, maxAmount);
        let minimumCheck = amount >= MIN_AMOUNT
        
        if(amount == -1) { message.channel.send("You only have " + maxAmount + " coins."); }
        else if(amount == -3) { message.channel.send("Invalid amount given."); }
        else if(minimumCheck == false) { message.channel.send("You cannot gamble less than " + MIN_AMOUNT + "."); }

        return {minimumCheck, amount};
    }
    console.log("UserData not found")
    return {minimumCheck: false, amount: 0}
}

function getAmount(rawAmount, maxAmount=null) {
    if(rawAmount == "max" || rawAmount == "all") {
        return maxAmount;
    }
    else if(!isNaN(rawAmount)) {
        if(maxAmount !== null) {
            rawAmount = parseInt(rawAmount);
            if(rawAmount <= maxAmount) {
                return rawAmount;
            }
            else { return -1; } //if not enough, return -1
        }
        else { return rawAmount; }
    }
    else { return -3; } //if not valid amount return -3
}

function depositWallet(UID, amount) { //TODO
    if(!isNaN(amount)) {
        console.log("Adding " + amount + " to user " + UID + "'s account.");
        userData[UID].walletBalance += parseInt(amount);
    }
    else { console.log("Invalid amount!") }
    return parseInt(amount);
}

function withdrawWallet(UID, amount) { //TODO
    if(!isNaN(amount)) {
        balance = userData[UID].walletBalance;
        if(amount > balance) {amount = balance;}

        console.log("Removing " + amount + " from user " + UID + "'s account.");
        userData[UID].walletBalance -= amount;
    }
    else { console.log("Invalid amount!") }
    return amount;
}

function calculateWinnings(amount) { //TODO
    return 0
}

function validateNumericArgument(args, index) {
    return (args[index] && !isNaN(args[index]))
}

function getPrintableUserString(UID) {
    return "<@!" + UID +">"
}

function validateUID(UID) {
    UID = UID.substring(3, UID.length-1)
    return (userData[UID] !== null && userData[UID] !== undefined)
}

function giveMoney(message, args) {
    let UID = message.author.id;
    let coins = 0
    let amount = 0
    
    if(args.length > 2) { //ex -givemoney @sampleUser 1000
        UID = args[1];
        coins = args[2]
        if(!validateUID(UID)) { message.channel.send("Invalid user specified."); return; }
        if(!validateNumericArgument(args, 2)) { message.channel.send("Invalid amount specified."); return; }
        amount = getAmount(coins)

        if(amount >= 0) { depositWallet(UID, amount); }
    }
    else { //ex -givemoney 1000
        coins = args[1]
        if(!validateNumericArgument(args, 1)) { message.channel.send("Invalid amount specified."); return; }
        amount = getAmount(coins)

        if(amount >= 0) { depositWallet(UID, amount); }
    }
    message.channel.send(getPrintableUserString(UID) +" given " + amount + " coins"); return;
}

function takeMoney(message, args) {
    let UID = message.author.id;
    let coins = 0
    let amount = 0
    let balance = 0

    if(args.length > 2) { //ex -takemoney @sampleUser 1000
        UID = args[1];
        coins = args[2]
        if(!validateUID(UID)) { message.channel.send("Invalid user specified."); return; }
        balance = userData[UID].walletBalance
        amount = getAmount(coins, balance)

        if(amount >= 0) { withdrawWallet(UID, amount); }
        else { message.channel.send("Invalid amount specified."); return; }
    }
    else { //ex -takemoney 1000
        coins = args[1]
        balance = userData[UID].walletBalance
        amount = getAmount(coins, balance)

        if(amount >= 0) { withdrawWallet(UID, amount); }
        else { message.channel.send("Invalid amount specified."); return; }
    }
    
    message.channel.send("Taken " + amount + " coins from " + getPrintableUserString(UID)); return;
}

function CLI(message, args, userData) {
    switch (args[0]) {
        case "ping":
            message.channel.send("pong");
            return;
        case "roll":
            if(validateNumericArgument(args, 1)) {
                roll(message, args)
            }
            else {
                message.reply(HELP_MESSAGE);
            }
            return;
        case "clear":
            if(validateNumericArgument(args, 1) && args[1] > 0) {
                message.channel.bulkDelete(args[1]);
                message.channel.send("Cleared **" + args[1] + "** messages.");
            }
            else { message.reply(HELP_MESSAGE); }
            return;
        case "stats":
            if(userData[message.author.id]) {
                //TODO
            }
            else {
                message.reply("No stats to display...");
            }
            return;
        case "bal": case "balance":
            if(args.length > 1) {
                //TODO
            }
            else { message.reply(HELP_MESSAGE); }
            return
        case "gamble":
            if(args.length > 1) {
                gamble(message, args)
            }
        case "blackjack":
            return;
        case "version":
            message.channel.send("The current version is " + VERSION);
            return;
        case "help":
            return;
        case "givemoney":
            if(args.length > 1) {
                giveMoney(message, args)
            }
            else { message.reply(HELP_MESSAGE); }
            return;
        case "takemoney":
            if(args.length > 1) {
                takeMoney(message, args)
            }
            else { message.reply(HELP_MESSAGE); }
            return;
        default:
            return;
    }
}


