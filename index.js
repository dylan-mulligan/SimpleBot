/*
* This bot is pretty basic, it has a rudimentary CLI and a few
* economy features such as user bank accounts and wallets. There
* are a few things to use money on 50/50 gambling and (coming soon)
* blackjack.
*/

//Discord interface setup
const Discord = require('discord.js');
const bot = new Discord.Client();
const fs = require('fs');
//const blackjack = require("./blackjack.js")
//const gamble = require("./blackjack.js")

//Retrieving bot token (password)
let token = getToken();
var userData = require('./data/user-data.json');

//Global constants
const PREFIX = '=';
const HELP_MESSAGE = "Invalid Arguments, use -help <command> for help";
const VERSION = "0.1";
const BOT_ID = "750833421252689930";
const MIN_AMOUNT = 500;
const BOT_NAME = "SharkPog Bot";
let guild = null

//Bot authentication
console.log("Bot logging in...");
bot.login(token);
try { //TODO: PROPER TRY/CATCH FOR INVALID TOKEN
    bot.on('ready', () =>{
    console.log("Login successful!");
    }) 
}
catch { console.log("Login failed! Exiting..."); return; }

//Event handler for all messages across all channels
bot.on('message', message=>{
    if(guild == null) { guild = message.guild; } //sets current server before each message
    guild.roles.fetch().then(async roles => { //creates admin role for the bot if it does not exist
        if(!roles.cache.find(r => r.name === 'SharkPogBotAdmin')) {
            await roles.create({data: {name: "SharkPogBotAdmin", color: "RED"}});
        }
    })
    let UID = message.author.id
    if(!message.author.bot) {
        //try { data = JSON.parse(fs.readFileSync('data/user-data.json', 'utf8')); } //OUTDATED DATA HANDLING
        //catch(e) { console.log('Error:', e.stack); }
        
        //if message has correct prefix, run CLI
        var prefix = message.content.substring(0, PREFIX.length);
        if(prefix.startsWith(PREFIX)) {
            if(message.content !== "") {
                let args = message.content.substring(PREFIX.length).split(" "); //tokenizes message
                if (!userData[UID]) { createUser(UID, message.author.username); } //ensures user exists within data structure to avoid errors
                CLI(message, args); //main CLI function
            }
        }
        userData[UID].username = message.author.username //poor implementation of username updating every message //TODO: FIX THIS POOP
        fs.writeFileSync("./data/user-data.json", JSON.stringify(userData, null, 2), console.error);
        guild = null //resets current server after each message
        //try { data = JSON.parse(fs.readFileSync('data/user-data.json', 'utf8')); } //OUTDATED DATA HANDLING
        //catch(e) { console.log('Error:', e.stack); }
    }
})

function createUser(UID, username) { //creates new user in user-data.json with a given UID
    userData[UID] = {}
    userData[UID].walletBalance = 5000
    userData[UID].bankBalance = 1000
    userData[UID].bankCapacity = 20000
    userData[UID].username = username
    userData[UID].inventory = {}
}

function rollDie(sides) { //"rolls a die" with given sides and returns the result
    return Math.round(Math.random() * sides);
}

function createEmbed(title, description, thumbnail=null, url=null) { //creates a discord embed object and returns it
    let embed = new Discord.MessageEmbed()
    .setTitle(title)
    .setDescription(description)
    .setImage(thumbnail)
    .setURL(url);
    return embed;
}

function getToken() { //retrieves bot token (password) from external file
    try {
        let token = fs.readFileSync('../Tokens/SharkPogBot.txt', 'utf8');
        return token;
    } 
    catch(e) {
        console.log('Error:', e.stack);
    }
}

function roll(message, args) { //rolls given amount of 6-sided die and displays them to the user
    let roll = "Your Roll: **";
    let rNum = parseInt(args[1]);
    let title = "**" + message.author.username + "'s Roll**";
    let description = "\n"
    if(rNum > 0 && rNum < 20) {
        for(let i = 0; i < rNum; i++) {
            roll += rollDie(6) + " ";
        }
        description = roll + "**"
        message.channel.send(createEmbed(title, description));
        return;
    }
    else { message.channel.send("Please enter a valid number of die (1-20)!"); return; }
}

function gamble(message, args) { 
    /*rolls 2 die for both the player and the bot, highest score wins
    Winnings are 2 * bet */
    let UID = message.author.id;
    let checkBal = checkBalance(UID, args[1], message); //validates that user actually has bet amount
    if(checkBal['minimumCheck']) {
        //play game
        let playerName = message.author.username;
        let playerScore = rollDie(6) + rollDie(6);
        let botScore = rollDie(6) + rollDie(6);
        let gameResult = playerScore > botScore;
        let gambleAmount = checkBal['amount'];
        let winnings = calculateWinnings(gambleAmount);
        let description = "";

        //add/deduct money
        if(gameResult) { 
            description = "You won **" + winnings + "** coins.";
            depositWallet(message.author.id, winnings); 
        }
        else { 
            description = "You lost **" + gambleAmount + "** coins.";
            withdrawWallet(message.author.id, gambleAmount);
        }

        //display results to user
        let title = "**" + message.author.username + "'s gambling game**";
        description += "\nYou now have **" + userData[UID].walletBalance + "** coins.\n\n" +
        "**" + playerName + "** Rolled ``" + playerScore + "``\n" +
        "**" + BOT_NAME + "** Rolled ``" + botScore + "``";
        message.channel.send(createEmbed(title, description));
    }
}

function checkBalance(UID, amount, message) { //checks if the user has the specified amount in their wallet
    if(userData[UID] != null) {
        let maxAmount = userData[UID].walletBalance;
        amount = getAmount(amount, maxAmount);
        let minimumCheck = amount >= MIN_AMOUNT;
        
        if(amount == -1) { message.channel.send("You only have " + maxAmount + " coins."); }
        else if(amount == -3) { message.channel.send("Invalid amount given."); }
        else if(minimumCheck == false) { message.channel.send("You cannot gamble less than " + MIN_AMOUNT + "."); }

        return {minimumCheck, amount};
    }
    console.log("User not recognized: " + UID);
    return {minimumCheck: false, amount: 0}
}

function getAmount(rawAmount, maxAmount=null) { //formats amount input into a valid integer
    if((rawAmount == "max" || rawAmount == "all") && maxAmount !== null) { 
        return maxAmount;
    }
    else if(!isNaN(rawAmount)) {
        if(maxAmount !== null) {
            rawAmount = parseInt(rawAmount);
            if(rawAmount <= maxAmount) {
                return rawAmount;
            }
            else { return -1; } //if user does not have enough, return -1
        }
        else { return rawAmount; }
    }
    else { return -3; } //if amount is not valid amount return -3
}

function depositWallet(UID, amount) { //depoist amount into user's wallet
    if(!isNaN(amount)) {
        amount = parseInt(amount)
        console.log("Adding " + amount + " to user " + UID + "'s wallet.");
        userData[UID].walletBalance += amount;
        return amount
    }
    else { console.log("Invalid amount!"); return -1; }
}

function withdrawWallet(UID, amount) { //withdraw amount from user's wallet
    if(!isNaN(amount)) {
        amount = parseInt(amount)
        balance = userData[UID].walletBalance;
        if(amount > balance) {amount = balance;}
        if(amount > 0) {
            console.log("Removing " + amount + " from user " + UID + "'s wallet.");
            userData[UID].walletBalance -= amount;
            return amount;
        }
        else { console.log("Nothing to withdraw!"); return -2; }
    }
    else { console.log("Invalid amount!"); return -1; }
}

function depositBank(UID, amount) { //depoist amount into user's bank
    if(!isNaN(amount)) {
        amount = parseInt(amount);
        let remainingBalance = getBankCapacity(UID) - getBankBalance(UID);
        if(remainingBalance == 0) { return -1; }
        if(amount > remainingBalance) { amount = remainingBalance; }
        if(amount > 0) {
            console.log("Adding " + amount + " to user " + UID + "'s bank account.");
            userData[UID].bankBalance += amount;
            return amount;
        }
        else { console.log("Nothing to deposit!"); return -2; }
    }
    else { console.log("Invalid amount!"); return -1; }
}

function withdrawBank(UID, amount) { //withdraw amount from user's bank
    if(!isNaN(amount)) {
        amount = parseInt(amount)
        balance = userData[UID].bankBalance;
        if(amount > balance) {amount = balance;}
        if(amount > 0) {
            console.log("Removing " + amount + " from user " + UID + "'s bank account.");
            userData[UID].bankBalance -= amount;
            return amount;
        }
        else { console.log("Nothing to withdraw!"); return -2; }
    }
    else { console.log("Invalid amount!"); return -1; }
}

function deposit(message, UID, amount) { //deposits amount from user's wallet to user's bank
    let tempAmount = getAmount(amount, getWalletBalance(UID));
    if(tempAmount >= 0) {
        amount = tempAmount;
        if(validateUID(UID)) {
            let depoited = depositBank(UID, amount)
            if(depoited == -1) {
                message.channel.send("Your bank is full!");
                return;
            }
            else if(depoited == -2) {
                message.channel.send("You can't deposit nothing!");
                return;
            }
            if(!withdrawWallet(UID, depoited)) { 
                message.channel.send("You do not have " + amount + " coins to deposit.");
                return;
            }
            message.channel.send("You deposited " + depoited + " coins to your bank account.");
            return;
        }
    }
    else { message.channel.send("You do not have " + amount + " coins in your wallet."); }
}

function withdraw(message, UID, amount) { //withdraws amount from user's bank to user's wallet
    let tempAmount = getAmount(amount, getBankBalance(UID));
    if(tempAmount >= 0) {
        amount = tempAmount;
        if(validateUID(UID)) {
            let withdrawn = withdrawBank(UID, amount);
            if(withdrawn == -1) { 
                message.channel.send("You do not have " + amount + " coins to withdraw.");
                return;
            }
            else if(withdrawn == -2) {
                message.channel.send("You can't withdraw nothing!");
                return;
            }
            depositWallet(UID, withdrawn)
            message.channel.send("You withdrew " + amount + " coins from your bank account.");
            return;
        }
    }
    else { message.channel.send("You do not have " + amount + " coins in your bank account."); }
}

function calculateWinnings(amount) { //calculates a user's winnings //TODO: More complex winnings
    return amount;
}

function validateNumericArgument(args, index) { //validates a value args[index] exists and is numeric
    return (args[index] && !isNaN(args[index]));
}

function getPrintableUserString(UID) { //convert's UID into discord recognizable format (for mentions)
    return "<@!" + UID +">";
}

function getRawUID(UID) { //converts a mention (discord recognizable format) to raw UID
    return UID.substring(3, UID.length-1);
}

function validateUID(UID) { //validates if user has a valid data entry in user-data.json
    return (userData[UID] !== null && userData[UID] !== undefined);
}

function giveMoney(message, args) { //gives a specified amount of money to either the message author or a specified user
    let UID = message.author.id;
    let coins = 0;
    let amount = 0;
    
    if(args.length > 2) { //ex. -givemoney @sampleUser 1000
        UID = getRawUID(args[1]);
        coins = args[2];
        if(!validateUID(UID)) { message.channel.send("Invalid user specified."); return; }
        if(!validateNumericArgument(args, 2)) { message.channel.send("Invalid amount specified."); return; }
        amount = getAmount(coins)

        if(amount >= 0) { depositWallet(UID, amount); }
    }
    else { //ex. -givemoney 1000
        coins = args[1]
        if(!validateNumericArgument(args, 1)) { message.channel.send("Invalid amount specified."); return; }
        amount = getAmount(coins)

        if(amount >= 0) { depositWallet(UID, amount); }
    }
    message.channel.send(getPrintableUserString(UID) +" given " + amount + " coins"); return;
}

function takeMoney(message, args) {//takes a specified amount of money from either the message author or a specified user
    let UID = message.author.id;
    let coins = 0;
    let amount = 0;
    let balance = 0;

    if(args.length > 2) { //ex. -takemoney @sampleUser 1000
        UID = getRawUID(args[1]);
        coins = args[2]
        if(!validateUID(UID)) { message.channel.send("Invalid user specified."); return; }
        balance = userData[UID].walletBalance
        amount = getAmount(coins, balance)

        if(amount >= 0) { withdrawWallet(UID, amount); }
        else { message.channel.send("Invalid amount specified."); return; }
    }
    else { //ex. -takemoney 1000
        coins = args[1];
        balance = userData[UID].walletBalance;
        amount = getAmount(coins, balance);

        if(amount >= 0) { withdrawWallet(UID, amount); }
        else { message.channel.send("Invalid amount specified."); return; }
    }
    
    message.channel.send("Taken " + amount + " coins from " + getPrintableUserString(UID)); return;
}

function getWalletBalance(UID) { //returns the balance of a user's wallet
    balance = userData[UID].walletBalance;
    if(balance !== null && balance !== undefined) {
        return balance;
    }
    else { console.log("User not recognized: " + UID); }
}

function getBankBalance(UID) { //returns the balance of a user's bank
    balance = userData[UID].bankBalance;
    if(balance !== null && balance !== undefined) {
        return balance;
    }
    else { console.log("User not recognized: " + UID); }
}

function getBankCapacity(UID) { //returns the capacity of a user's bank
    if(UID !== undefined) { 
        capacity = userData[UID].bankCapacity;
        if(capacity !== null && capacity !== undefined) {
            return capacity;
        }
        else { console.log("User not recognized: " + UID); }
    }
}

function getBalances(message, args) { //displays the balance information of a user
    let UID = message.author.id;
    if(args.length > 1) {
        args[1] = getRawUID(args[1])
        if(validateUID(args[1])) { UID = args[1]; }
    }
    
    if(!validateUID(UID)) { message.channel.send("Invalid user specified."); return; }
    let walletBalance = getWalletBalance(UID);
    let bankBalance = getBankBalance(UID);
    let totalBalance = parseInt(bankBalance) + parseInt(walletBalance);
    let title = "**" + userData[UID].username + "'s balance**";
    let description = "**Wallet**: " + walletBalance +
    "\n**Bank**: " + bankBalance + "/" + getBankCapacity(UID) +
    "\n**Total**: " + totalBalance;

    message.channel.send(createEmbed(title, description));
    return totalBalance;
}

/* //TODO: Add getUser functionality with the use of Promises
function getUser(UID) {
    let user = bot.users.fetch(UID);
    user.then(value => { return value });
}
*/

function getUsername(UID) { //validates the given UID and returns the username of the specified user
    if(!validateUID(UID)) { console.log("Invalid user specified."); return; }
    return userData[UID].username
}

function share(message, args) { //gives a specified amount of coins with a specified user
    let UID = getRawUID(args[1]);
    let amount = args[2];
    let tempAmount = amount;
    amount = getAmount(amount);
    if(!validateUID(UID)) { message.channel.send("Invalid user specified."); return; }
    if(amount > 0) {
        withdrawWallet(message.author.id, amount);
        depositWallet(UID, amount);
        message.channel.send("You gave " + amount + " coins to " + getUsername(UID) + ".")
    }
    else if(amount == -1){ 
        message.channel.send("You do not have " + tempAmount + " coins to give."); return; 
    }
    else if(amount == -3) {
        message.channel.send("Invalid amount specified."); return; 
    }
}

function hasBotAdminPerm(UID) { //checks if given user has bot admin role
    guild.members.fetch(async member => {
        if(member.id = UID) {
            return member.roles.cache.fetch(role => role.name === 'SharkPogBotAdmin')
        }
    })
}

function CLI(message, args) { //main command line interface that parses user data and passes it to relevant functions
    //switch handles user entered command
    switch (args[0]) {
        case "ping": //pong
            message.channel.send("pong");
            return;
        case "roll": //calls roll function
            if(validateNumericArgument(args, 1)) { roll(message, args) }
            else {  message.channel.send(HELP_MESSAGE); } //if not enough args, print help message
            return;
        case "clear": //clears args[1] amount of messages (up to 100)
            if(validateNumericArgument(args, 1) && 100 >= args[1] > 0) {
                message.channel.bulkDelete(args[1]);
                message.channel.send("Cleared **" + args[1] + "** messages.");
            }
            else {  message.channel.send(HELP_MESSAGE); } //if not enough args, print help message
            return;
        case "stats": //calls stats function
            //TODO
            return;
        case "bal": case "balance": //calls getBalances function
            getBalances(message, args);
            return;
        case "gamble": //calls gamble function
            if(args.length > 1) {
                gamble(message, args)
            }
            else { message.channel.send(HELP_MESSAGE); } //if not enough args, print help message
            return;
        case "blackjack": //calls blackjack function
            if(args.length > 1) {
                blackjack.run(message, args)
            }
            else { message.channel.send(HELP_MESSAGE); } //if not enough args, print help message
            return;
        case "version": //displays bot version
            message.channel.send("The current version is " + VERSION);
            return;
        case "help": //displays command help page
            return;
        case "givemoney": //calls giveMoney function  //TODO: Permissions
            hasBotAdminPerm(message.author.id)
            if(false && args.length > 1) {
                giveMoney(message, args)
            }
            else { message.channel.send(HELP_MESSAGE); } //if not enough args, print help message
            return;
        case "takemoney": //calls takeMoney function //TODO: Permissions
            if(args.length > 1) {
                takeMoney(message, args)
            }
            else { message.channel.send(HELP_MESSAGE); } //if not enough args, print help message
            return;
        case "send": //sends a specified message from the bot
            if(args.length > 1) { message.channel.send(args[1]); }
            else { message.channel.send(HELP_MESSAGE); } //if not enough args, print help message
            return;
        case "dep": case "deposit": //calls deposit function
            if(args.length > 1) { 
                deposit(message, message.author.id, args[1])
            }
            else { message.channel.send(HELP_MESSAGE); } //if not enough args, print help message
            return;
        case "with": case "withdraw": //calls withdraw function
            if(args.length > 1) { 
                withdraw(message, message.author.id, args[1])
            }
            else { message.channel.send(HELP_MESSAGE); } //if not enough args, print help message
            return;
        case "share":
            if(args.length > 2) {
                share(message, args)
            }
            else { message.channel.send(HELP_MESSAGE); } //if not enough args, print help message
            return;
        default:
            return;
    }
}


