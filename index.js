const Discord = require('discord.js');
const bot = new Discord.Client();
const fs = require('fs');

let token = getToken();
var userData = require('./data/user-data.json');

const PREFIX = '-';
const HELP_MESSAGE = "Invalid Arguments, use -help <command> for help";
const VERSION = "0.1";
const BOT_ID = "750833421252689930";
const MIN_AMOUNT = 500;
const BOT_NAME = "SharkPog Bot";


console.log("Bot logging in...");
bot.login(token);


try { //TODO: PROPER TRY/CATCH FOR INVALID TOKEN
    bot.on('ready', () =>{
    console.log("Login successful!");
    }) 
}
catch { console.log("Login failed! Exiting..."); return; }


bot.on('message', message=>{
    let UID = message.author.id
    if(UID !== 1) { //replace 1 with BOT_ID
        //try { data = JSON.parse(fs.readFileSync('data/user-data.json', 'utf8')); }
        //catch(e) { console.log('Error:', e.stack); }
        
        var prefix = message.content.substring(0, PREFIX.length);
        if(prefix.startsWith(PREFIX)) {
            if(message.content !== "") {
                let args = message.content.substring(PREFIX.length).split(" ");
                if (!userData[UID]) {
                    createUser(UID);
                }
                
                CLI(message, args);
            }
        }
        userData[UID].username = message.author.username //poor implementation of username updating every message //TODO: FIX THIS POOP
        fs.writeFileSync("./data/user-data.json", JSON.stringify(userData, null, 2), console.error);
        //try { data = JSON.parse(fs.readFileSync('data/user-data.json', 'utf8')); }
        //catch(e) { console.log('Error:', e.stack); }
    }
})

function createUser(UID, message) {
    userData[UID] = {}
    userData[UID].walletBalance = 5000
    userData[UID].bankBalance = 1000
    userData[UID].bankCapacity = 3000
    userData[UID].username = message.author.username
}

function rollDie(sides) {
    return Math.round(Math.random() * sides);
}

function createEmbed(title, description, thumbnail=null, url=null) {
    let embed = new Discord.MessageEmbed()
    .setTitle(title)
    .setDescription(description)
    .setImage(thumbnail)
    .setURL(url);
    return embed;
}

function getToken() {    
    try {
        let token = fs.readFileSync('../Tokens/SharkPogBot.txt', 'utf8');
        return token;
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
        let minimumCheck = amount >= MIN_AMOUNT;
        
        if(amount == -1) { message.channel.send("You only have " + maxAmount + " coins."); }
        else if(amount == -3) { message.channel.send("Invalid amount given."); }
        else if(minimumCheck == false) { message.channel.send("You cannot gamble less than " + MIN_AMOUNT + "."); }

        return {minimumCheck, amount};
    }
    console.log("User not recognized: " + UID);
    return {minimumCheck: false, amount: 0}
}

function getAmount(rawAmount, maxAmount=null) {
    if((rawAmount == "max" || rawAmount == "all") && maxAmount !== null) {
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

function depositWallet(UID, amount) {
    if(!isNaN(amount)) {
        amount = parseInt(amount)
        console.log("Adding " + amount + " to user " + UID + "'s wallet.");
        userData[UID].walletBalance += amount;
        return amount
    }
    else { console.log("Invalid amount!"); return -1; }
}

function withdrawWallet(UID, amount) {
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

function depositBank(UID, amount) {
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

function withdrawBank(UID, amount) {
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

function deposit(message, UID, amount) {
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

function withdraw(message, UID, amount) {
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

function calculateWinnings(amount) { //TODO
    return 2 * amount;
}

function validateNumericArgument(args, index) {
    return (args[index] && !isNaN(args[index]));
}

function getPrintableUserString(UID) {
    return "<@!" + UID +">";
}

function getRawUID(UID) {
    return UID.substring(3, UID.length-1);
}

function validateUID(UID) {
    return (userData[UID] !== null && userData[UID] !== undefined);
}

function giveMoney(message, args) {
    let UID = message.author.id;
    let coins = 0;
    let amount = 0;
    
    if(args.length > 2) { //ex -givemoney @sampleUser 1000
        UID = getRawUID(args[1]);
        coins = args[2];
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
    let coins = 0;
    let amount = 0;
    let balance = 0;

    if(args.length > 2) { //ex -takemoney @sampleUser 1000
        UID = getRawUID(args[1]);
        coins = args[2]
        if(!validateUID(UID)) { message.channel.send("Invalid user specified."); return; }
        balance = userData[UID].walletBalance
        amount = getAmount(coins, balance)

        if(amount >= 0) { withdrawWallet(UID, amount); }
        else { message.channel.send("Invalid amount specified."); return; }
    }
    else { //ex -takemoney 1000
        coins = args[1];
        balance = userData[UID].walletBalance;
        amount = getAmount(coins, balance);

        if(amount >= 0) { withdrawWallet(UID, amount); }
        else { message.channel.send("Invalid amount specified."); return; }
    }
    
    message.channel.send("Taken " + amount + " coins from " + getPrintableUserString(UID)); return;
}

function getWalletBalance(UID) {
    balance = userData[UID].walletBalance;
    if(balance !== null && balance !== undefined) {
        return balance;
    }
    else { console.log("User not recognized: " + UID); }
}

function getBankBalance(UID) {
    balance = userData[UID].bankBalance;
    if(balance !== null && balance !== undefined) {
        return balance;
    }
    else { console.log("User not recognized: " + UID); }
}

function getBankCapacity(UID) {
    if(UID !== undefined) { 
        capacity = userData[UID].bankCapacity;
        if(capacity !== null && capacity !== undefined) {
            return capacity;
        }
        else { console.log("User not recognized: " + UID); }
    }
}

function getBalances(message, args) {
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

/*
function getUser(UID) {
    let user = bot.users.fetch(UID);
    user.then(value => { return value });
}
*/

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
                message.channel.send(HELP_MESSAGE);
            }
            return;
        case "clear":
            if(validateNumericArgument(args, 1) && 100 >= args[1] > 0) {
                message.channel.bulkDelete(args[1]);
                message.channel.send("Cleared **" + args[1] + "** messages.");
            }
            else { message.channel.send(HELP_MESSAGE); }
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
            getBalances(message, args);
            return;
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
        case "givemoney": //TODO: Permissions
            if(args.length > 1) {
                giveMoney(message, args)
            }
            else { message.channel.send(HELP_MESSAGE); }
            return;
        case "takemoney": //TODO: Permissions
            if(args.length > 1) {
                takeMoney(message, args)
            }
            else { message.channel.send(HELP_MESSAGE); }
            return;
        case "send":
            if(args.length > 1) { message.channel.send(args[1]); }
            return;
        case "dep": case "deposit":
            if(args.length > 1) { 
                deposit(message, message.author.id, args[1])
            }
            return;
        case "with": case "withdraw":
            if(args.length > 1) { 
                withdraw(message, message.author.id, args[1])
            }
            return;
        default:
            return;
    }
}


