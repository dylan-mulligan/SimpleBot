const utils = require("./utils")
const gc = require("./global_constants")

function checkBalance(userData, minBetAmount, UID, amount, message) { //checks if the user has the specified amount in their wallet
    if(utils.validateUID(userData, UID)) {
        let maxAmount = userData[UID].walletBalance;
        amount = getAmount(amount, maxAmount);
        let minimumCheck = amount >= minBetAmount;
        
        if(amount == -1) { message.channel.send("You only have " + maxAmount + " coins."); }
        else if(amount == -3) { message.channel.send("Invalid amount given."); }
        else if(minimumCheck == false) { message.channel.send("You cannot gamble less than " + minBetAmount + "."); }

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

function depositWallet(userData, UID, amount) { //depoist amount into user's wallet
    if(!isNaN(amount) && utils.validateUID(userData, UID)) {
        amount = parseInt(amount)
        console.log("Adding " + amount + " to user " + UID + "'s wallet.");
        userData[UID].walletBalance += amount;
        return amount
    }
    else { console.log("Invalid amount!"); return -1; }
}

function withdrawWallet(userData, UID, amount) { //withdraw amount from user's wallet
    if(!isNaN(amount) && utils.validateUID(userData, UID)) {
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

function depositBank(userData, UID, amount) { //depoist amount into user's bank
    if(!isNaN(amount) && utils.validateUID(userData, UID)) {
        amount = parseInt(amount);
        let remainingBalance = getBankCapacity(userData, UID) - getBankBalance(userData, UID);
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

function withdrawBank(userData, UID, amount) { //withdraw amount from user's bank
    if(!isNaN(amount) && utils.validateUID(userData, UID)) {
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

function deposit(userData, message, UID, amount) { //deposits amount from user's wallet to user's bank
    let tempAmount = getAmount(amount, getWalletBalance(userData, UID));
    if(tempAmount >= 0) {
        amount = tempAmount;
        if(utils.validateUID(userData, UID)) {
            let depoited = depositBank(userData, UID, amount)
            if(depoited == -1) {
                message.channel.send("Your bank is full!");
                return;
            }
            else if(depoited == -2) {
                message.channel.send("You can't deposit nothing!");
                return;
            }
            if(!withdrawWallet(userData, UID, depoited)) { 
                message.channel.send("You do not have " + amount + " coins to deposit.");
                return;
            }
            message.channel.send("You deposited " + depoited + " coins to your bank account.");
            return;
        }
    }
    else { message.channel.send("You do not have " + amount + " coins in your wallet."); }
}

function withdraw(userData, message, UID, amount) { //withdraws amount from user's bank to user's wallet
    let tempAmount = getAmount(amount, getBankBalance(userData, UID));
    if(tempAmount >= 0) {
        amount = tempAmount;
        if(utils.validateUID(userData, UID)) {
            let withdrawn = withdrawBank(userData, UID, amount);
            if(withdrawn == -1) { 
                message.channel.send("You do not have " + amount + " coins to withdraw.");
                return;
            }
            else if(withdrawn == -2) {
                message.channel.send("You can't withdraw nothing!");
                return;
            }
            depositWallet(userData, UID, withdrawn)
            message.channel.send("You withdrew " + amount + " coins from your bank account.");
            return;
        }
    }
    else { message.channel.send("You do not have " + amount + " coins in your bank account."); }
}

function share(userData, message, args) { //gives a specified amount of coins with a specified user
    let UID = utils.getRawUID(args[1]);
    let amount = args[2];
    let tempAmount = amount;
    amount = getAmount(amount);
    if(!utils.validateUID(userData, UID)) { message.channel.send("Invalid user specified."); return; }
    if(amount > 0) {
        withdrawWallet(userData, message.author.id, amount);
        depositWallet(userData, UID, amount);
        message.channel.send("You gave " + amount + " coins to " + utils.getUsername(userData, UID) + ".")
    }
    else if(amount == -1){ 
        message.channel.send("You do not have " + tempAmount + " coins to give."); return; 
    }
    else if(amount == -3) {
        message.channel.send("Invalid amount specified."); return; 
    }
}

function calculateWinnings(amount) { //calculates a user's winnings //TODO: More complex winnings
    return amount;
}

function giveMoney(userData, message, args) { //gives a specified amount of money to either the message author or a specified user
    let UID = message.author.id;
    let coins = 0;
    let amount = 0;
    
    if(args.length > 2) { //ex. -givemoney @sampleUser 1000
        UID = utils.getRawUID(args[1]);
        coins = args[2];
        if(!utils.validateUID(userData, UID)) { message.channel.send("Invalid user specified."); return; }
        if(!utils.validateNumericArgument(args, 2)) { message.channel.send("Invalid amount specified."); return; }
        amount = getAmount(coins)

        if(amount >= 0) { depositWallet(userData, UID, amount); }
    }
    else { //ex. -givemoney 1000
        coins = args[1]
        if(!utils.validateNumericArgument(args, 1)) { message.channel.send("Invalid amount specified."); return; }
        amount = getAmount(coins)

        if(amount >= 0) { depositWallet(userData, UID, amount); }
    }
    message.channel.send(utils.getPrintableUserString(UID) +" given " + amount + " coins"); return;
}

function takeMoney(userData, message, args) {//takes a specified amount of money from either the message author or a specified user
    let UID = message.author.id;
    let coins = 0;
    let amount = 0;
    let balance = 0;

    if(args.length > 2) { //ex. -takemoney @sampleUser 1000
        UID = utils.getRawUID(args[1]);
        coins = args[2]
        if(!utils.validateUID(userData, UID)) { message.channel.send("Invalid user specified."); return; }
        balance = userData[UID].walletBalance
        amount = getAmount(coins, balance)

        if(amount >= 0) { withdrawWallet(userData, UID, amount); }
        else { message.channel.send("Invalid amount specified."); return; }
    }
    else { //ex. -takemoney 1000
        coins = args[1];
        balance = userData[UID].walletBalance;
        amount = getAmount(coins, balance);

        if(amount >= 0) { withdrawWallet(userData, UID, amount); }
        else { message.channel.send("Invalid amount specified."); return; }
    }
    
    message.channel.send("Taken " + amount + " coins from " + utils.getPrintableUserString(UID)); return;
}

function getWalletBalance(userData, UID) { //returns the balance of a user's wallet
    balance = userData[UID].walletBalance;
    if(balance !== null && balance !== undefined) {
        return balance;
    }
    else { console.log("User not recognized: " + UID); }
}

function getBankBalance(userData, UID) { //returns the balance of a user's bank
    balance = userData[UID].bankBalance;
    if(balance !== null && balance !== undefined) {
        return balance;
    }
    else { console.log("User not recognized: " + UID); }
}

function getBankCapacity(userData, UID) { //returns the capacity of a user's bank
    if(UID !== undefined) { 
        capacity = userData[UID].bankCapacity;
        if(capacity !== null && capacity !== undefined) {
            return capacity;
        }
        else { console.log("User not recognized: " + UID); }
    }
}

function getBalances(userData, message, args) { //displays the balance information of a user
    let UID = message.author.id;
    if(args.length > 1) {
        args[1] = utils.getRawUID(args[1])
        if(utils.validateUID(userData, args[1])) { UID = args[1]; }
    }
    
    if(!utils.validateUID(userData, UID)) { message.channel.send("Invalid user specified."); return; }
    let walletBalance = getWalletBalance(userData, UID);
    let bankBalance = getBankBalance(userData, UID);
    let totalBalance = parseInt(bankBalance) + parseInt(walletBalance);
    let title = "**" + userData[UID].username + "'s balance**";
    let description = "**Wallet**: " + walletBalance +
    "\n**Bank**: " + bankBalance + "/" + getBankCapacity(userData, UID) +
    "\n**Total**: " + totalBalance;
    message.channel.send(utils.createEmbed(title, description));
    return totalBalance;
}

function rob(userData, message, args, MIN_BET_AMOUNT) {
    UID = utils.getRawUID(args[1])
    bal = getWalletBalance(userData, message.author.id)
    targetBal = getWalletBalance(userData, UID)
    if(!utils.validateUID(userData, UID)) { message.channel.send("Invalid user specified."); return; }
    if(bal < MIN_BET_AMOUNT) { message.channel.send("You need at least " + MIN_BET_AMOUNT + " coins to rob someone."); return; }
    if(targetBal < MIN_BET_AMOUNT) { message.channel.send("User doesn't have at least " + MIN_BET_AMOUNT + " coins."); return; }

    if(utils.randomChance(0.5)) {
        robAmount = utils.randomInt(1, targetBal)
        size = parseFloat((robAmount / targetBal).toFixed(2))
        sizeString = ""
        if(size <= 0.33) { sizeString = "a small amount." }
        else if(size <= 0.5) { sizeString = "an okay amount." }
        else if(size <= 0.66) { sizeString = "a good amount." }
        else if(size < 1) { sizeString = "a large amount!" }
        else if(size == 1) { sizeString = "all of it!" }
        message.channel.send("You took " + sizeString)
        message.channel.send("You got " + robAmount + " coins.")
        withdrawWallet(userData, UID, robAmount)
        depositWallet(userData, message.author.id, robAmount)
    }
    else {
        lossAmount = utils.randomInt(MIN_BET_AMOUNT, bal)
        message.channel.send("You failed and lost " + lossAmount)
        withdrawWallet(userData, message.author.id, lossAmount)
    }
    userData[message.author.id].cooldowns.rob = Date.now()
}

module.exports = { 
    checkBalance, getAmount, depositWallet, withdrawWallet, depositBank, 
    withdrawBank, deposit, withdraw, share, calculateWinnings, giveMoney, 
    takeMoney, getWalletBalance, getBankBalance, getBankCapacity, getBalances,
    rob
}