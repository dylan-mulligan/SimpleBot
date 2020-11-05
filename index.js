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
const { blackjack } = require("./blackjack")
const { gamble } = require("./gamble")
const { getToken, createUser, validateNumericArgument, hasBotAdminPerm, 
    giveAdmin, removeAdmin, validateUID, getRawUID, validateMemory, 
    offCooldown, onCooldown } = require("./utils")
const { getBalances, deposit, withdraw, share, giveMoney, takeMoney, 
    rob } = require("./economy")
const { SecretHitler } = require("./secrethitler")
const { help } = require("./help")
const games = require("./games")
const gc = require("./global_constants")

let guild = null;

//Retrieving bot token (password)
let token = getToken(gc.FILEPATH);
var userData = require('./data/user-data.json');

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
    if(guild !== null && guild !== undefined) {
        guild.roles.fetch().then(async roles => { //creates admin role for the bot if it does not exist
            if(!roles.cache.find(r => r.name === gc.BOT_ADMIN_ROLE_NAME)) {
                await roles.create({data: {name: gc.BOT_ADMIN_ROLE_NAME, color: "RED"}});
            }
        })
        let UID = message.author.id
        if(!message.author.bot) {
            //if message has correct prefix, run CLI
            if(message.content.startsWith(gc.PREFIX)) {
                if(message.content !== "") {
                    createUser(userData, "0000", "EXAMPLE");
                    let args = []
                    message.content.substring(gc.PREFIX.length).split(" ").map(tempArg => {if(tempArg != "") { args.push(tempArg); }}); //tokenizes message
                    if (!userData[UID]) { createUser(userData, UID, message.author.username); } //ensures user exists within data structure to avoid errors
                    validateMemory(userData, UID);
                    CLI(message, args); //main CLI function
                }
                try{
                    userData[UID].username = message.author.username; //poor implementation of username updating every message //TODO: FIX THIS POOP
                }
                catch(e) {
                    console.log(e + message.author.username);
                }
            }
            fs.writeFileSync("./data/user-data.json", JSON.stringify(userData, null, 2), console.error);
            guild = null //resets current server after each message
        }
    } 
})

async function CLI(message, args) { //main command line interface that parses user data and passes it to relevant functions
    //switch handles user entered command
    switch (args[0]) {
        case "ping": //pong
            message.channel.send("pong");
            return;
        case "roll": //calls roll function
            if(validateNumericArgument(args, 1)) { games.roll(message, args); }
            else {  message.channel.send(gc.HELP_MESSAGE); } //if not enough args, print help message
            return;
        case "stats": //calls stats function
            //TODO
            return;
        case "bal": case "balance": //calls getBalances function
            getBalances(userData, message, args);
            return;
        case "gamble": //calls gamble function
            if(args.length > 1) {
                gamble(userData, gc.BOT_NAME, gc.MIN_BET_AMOUNT, message, args);
            }
            else { message.channel.send(gc.HELP_MESSAGE); } //if not enough args, print help message
            return;
        case "blackjack": //calls blackjack function
            if(args.length > 1) {
                blackjack(message, args);
            }
            else { message.channel.send(gc.HELP_MESSAGE); } //if not enough args, print help message
            return;
        case "version": case "ver": //displays bot version
            message.channel.send("The current version is " + gc.BOT_VERSION);
            return;
        case "help": case "commands": //displays command help page
            help(gc.PREFIX, gc.MIN_BET_AMOUNT, message, args)
            return;
        case "dep": case "deposit": //calls deposit function
            if(args.length > 1) { 
                deposit(userData, message, message.author.id, args[1]);
            }
            else { message.channel.send(gc.HELP_MESSAGE); } //if not enough args, print help message
            return;
        case "with": case "withdraw": //calls withdraw function
            if(args.length > 1) { 
                withdraw(userData, message, message.author.id, args[1]);
            }
            else { message.channel.send(gc.HELP_MESSAGE); } //if not enough args, print help message
            return;
        case "share": //calls share function
            if(args.length > 2) {
                share(userData, message, args);
            }
            else { message.channel.send(gc.HELP_MESSAGE); } //if not enough args, print help message
            return;
        case "search": //TODO
            return;
        case "rob": case "steal": //TODO
            if(args.length > 1) {
                if(offCooldown(userData, message.author.id, "rob")) {
                    rob(userData, message, args, gc.MIN_BET_AMOUNT);
                }
                else { onCooldown(userData, message, message.author.id, "rob", gc.COOLDOWNS); } //if not off cooldown, call onCooldown
            }
            else { message.channel.send(gc.HELP_MESSAGE); } //if not enough args, print help message
            return;
        case "bankrob": //TODO
            return;
        case "secrethitler":
            new SecretHitler(message.channel);
            return;
        //ADMIN COMMANDS
        case "clear": //clears args[1] amount of messages (up to 100)
            if(hasBotAdminPerm(guild, gc.BOT_ADMIN_ROLE_NAME, message.author.id)) {
                if(validateNumericArgument(args, 1) && 100 >= args[1] > 0 && message.channel.type !== "dm") {
                    await message.channel.bulkDelete(parseInt(args[1]) + 1).catch(e => console.log(e));
                    await message.channel.send("Cleared **" + args[1] + "** messages.").then(msg => msg.delete({"timeout": 5000})).catch(e => console.log(e));
                }
                else {  message.channel.send(gc.HELP_MESSAGE); } //if not enough args, print help message
            }
            else { message.channel.send(gc.PERMISSION_DENIED_MESSAGE); } //if no permissions, print no permissions message
            return;
        case "send": //sends a specified message from the bot
            if(args.length > 1 && hasBotAdminPerm(guild, gc.BOT_ADMIN_ROLE_NAME, message.author.id)) { 
                message.channel.send(message.content.substring(gc.PREFIX.length+4).trim());
            }
            else { message.channel.send(gc.HELP_MESSAGE); } //if not enough args, print help message
            return;
        case "givemoney": //calls giveMoney function
            if(hasBotAdminPerm(guild, gc.BOT_ADMIN_ROLE_NAME, message.author.id)) {
                if(args.length > 1) {
                    giveMoney(userData, message, args);
                }
                else { message.channel.send(gc.HELP_MESSAGE); } //if not enough args, print help message
            }
            else { message.channel.send(gc.PERMISSION_DENIED_MESSAGE); } //if no permissions, print no permissions message
            return;
        case "takemoney": //calls takeMoney function
            if(hasBotAdminPerm(guild, gc.BOT_ADMIN_ROLE_NAME, message.author.id)) {
                if(args.length > 1) {
                    takeMoney(userData, message, args);
                }
                else { message.channel.send(gc.HELP_MESSAGE); } //if not enough args, print help message
            }
            else { message.channel.send(gc.PERMISSION_DENIED_MESSAGE); } //if no permissions, print no permissions message
            return;
        case "giveadmin": //calls giveAdmin function
            if(hasBotAdminPerm(guild, gc.BOT_ADMIN_ROLE_NAME, message.author.id)) {
                if(args.length > 1) {
                    giveAdmin(userData, guild, gc.BOT_ADMIN_ROLE_NAME, message, args);
                }
                else { message.channel.send(gc.HELP_MESSAGE); } //if not enough args, print help message
            }
            else { message.channel.send(gc.PERMISSION_DENIED_MESSAGE); } //if no permissions, print no permissions message
            return;
        case "removeadmin": //calls removeAdmin function
            if(hasBotAdminPerm(guild, gc.BOT_ADMIN_ROLE_NAME, message.author.id)) {
                if(args.length > 1) {
                    removeAdmin(userData, guild, gc.BOT_ADMIN_ROLE_NAME, message, args);
                }
                else { message.channel.send(gc.HELP_MESSAGE); } //if not enough args, print help message
            }
            else { message.channel.send(gc.PERMISSION_DENIED_MESSAGE); } //if no permissions, print no permissions message
            return;
        case "hasadmin":
            let UID = getRawUID(args[1]);
            if(args.length > 1 && validateUID(userData, UID)) {
                
                if(hasBotAdminPerm(guild, gc.BOT_ADMIN_ROLE_NAME, UID)) { 
                    message.channel.send("User has " + gc.BOT_ADMIN_ROLE_NAME + " role.");
                }
                else { message.channel.send("User does not have " + gc.BOT_ADMIN_ROLE_NAME + " role."); }
            }
            else { message.channel.send("Invalid user specified."); }
            return;
        default:
            return;
    }
}

module.exports = { userData }