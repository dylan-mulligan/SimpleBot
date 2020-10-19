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
const economy = require("./economy")
const { getToken, createUser, validateNumericArgument, hasBotAdminPerm, giveAdmin, removeAdmin, validateUID, getRawUID } = require("./utils")
const games = require("./games")

//Global constants
const FILEPATH = '../Tokens/SharkPogBot.txt';
const PREFIX = '=';
const BOT_VERSION = "0.1";
const BOT_NAME = "SharkPogBot";
const BOT_ID = "750833421252689930";
const BOT_ADMIN_ROLE_NAME = "SharkPogBotAdmin"
const MIN_BET_AMOUNT = 500;
const PERMISSION_DENIED_MESSAGE = "You do not have permission to use this command!";
const HELP_MESSAGE = "Invalid Arguments, use -help <command> for help";
let guild = null;

//Retrieving bot token (password)
let token = getToken(FILEPATH);
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
    guild.roles.fetch().then(async roles => { //creates admin role for the bot if it does not exist
        if(!roles.cache.find(r => r.name === BOT_ADMIN_ROLE_NAME)) {
            await roles.create({data: {name: BOT_ADMIN_ROLE_NAME, color: "RED"}});
        }
    })
    let UID = message.author.id
    if(!message.author.bot) {
        //if message has correct prefix, run CLI
        var prefix = message.content.substring(0, PREFIX.length);
        if(prefix.startsWith(PREFIX)) {
            if(message.content !== "") {
                let args = []
                message.content.substring(PREFIX.length).split(" ").map(tempArg => {if(tempArg != "") { args.push(tempArg); }}); //tokenizes message
                if (!userData[UID]) { createUser(userData, UID, message.author.username); } //ensures user exists within data structure to avoid errors
                CLI(message, args); //main CLI function
            }
        }
        try{
            userData[UID].username = message.author.username //poor implementation of username updating every message //TODO: FIX THIS POOP
        }
        catch(e) {
            console.log(e)
        }
        fs.writeFileSync("./data/user-data.json", JSON.stringify(userData, null, 2), console.error);
        guild = null //resets current server after each message
    }
})

function CLI(message, args) { //main command line interface that parses user data and passes it to relevant functions
    //switch handles user entered command
    switch (args[0]) {
        case "ping": //pong
            message.channel.send("pong");
            return;
        case "roll": //calls roll function
            if(validateNumericArgument(args, 1)) { games.roll(message, args); }
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
            economy.getBalances(userData, message, args);
            return;
        case "gamble": //calls gamble function
            if(args.length > 1) {
                gamble(userData, BOT_NAME, MIN_BET_AMOUNT, message, args);
            }
            else { message.channel.send(HELP_MESSAGE); } //if not enough args, print help message
            return;
        case "blackjack": //calls blackjack function
            if(args.length > 1) {
                blackjack(message, args);
            }
            else { message.channel.send(HELP_MESSAGE); } //if not enough args, print help message
            return;
        case "version": //displays bot version
            message.channel.send("The current version is " + BOT_VERSION);
            return;
        case "help": //displays command help page
            //TODO
            return;
        case "send": //sends a specified message from the bot
            if(args.length > 1) { message.channel.send(args[1]); }
            else { message.channel.send(HELP_MESSAGE); } //if not enough args, print help message
            return;
        case "dep": case "deposit": //calls deposit function
            if(args.length > 1) { 
                economy.deposit(userData, message, message.author.id, args[1]);
            }
            else { message.channel.send(HELP_MESSAGE); } //if not enough args, print help message
            return;
        case "with": case "withdraw": //calls withdraw function
            if(args.length > 1) { 
                economy.withdraw(userData, message, message.author.id, args[1]);
            }
            else { message.channel.send(HELP_MESSAGE); } //if not enough args, print help message
            return;
        case "share": //calls share function
            if(args.length > 2) {
                economy.share(userData, message, args);
            }
            else { message.channel.send(HELP_MESSAGE); } //if not enough args, print help message
            return;
        case "givemoney": //calls giveMoney function
            if(hasBotAdminPerm(guild, BOT_ADMIN_ROLE_NAME, message.author.id)) {
                if(args.length > 1) {
                    economy.giveMoney(userData, message, args);
                }
                else { message.channel.send(HELP_MESSAGE); } //if not enough args, print help message
            }
            else { message.channel.send(PERMISSION_DENIED_MESSAGE); } //if no permissions, print no permissions message
            return;
        case "takemoney": //calls takeMoney function
            if(hasBotAdminPerm(guild, BOT_ADMIN_ROLE_NAME, message.author.id)) {
                if(args.length > 1) {
                    economy.takeMoney(userData, message, args);
                }
                else { message.channel.send(HELP_MESSAGE); } //if not enough args, print help message
            }
            else { message.channel.send(PERMISSION_DENIED_MESSAGE); } //if no permissions, print no permissions message
            return;
        case "giveadmin": //calls giveAdmin function
            if(hasBotAdminPerm(guild, BOT_ADMIN_ROLE_NAME, message.author.id)) {
                if(args.length > 1) {
                    giveAdmin(userData, guild, BOT_ADMIN_ROLE_NAME, message, args);
                }
                else { message.channel.send(HELP_MESSAGE); } //if not enough args, print help message
            }
            else { message.channel.send(PERMISSION_DENIED_MESSAGE); } //if no permissions, print no permissions message
            return;
        case "removeadmin": //calls removeAdmin function
            if(hasBotAdminPerm(guild, BOT_ADMIN_ROLE_NAME, message.author.id)) {
                if(args.length > 1) {
                    removeAdmin(userData, guild, BOT_ADMIN_ROLE_NAME, message, args);
                }
                else { message.channel.send(HELP_MESSAGE); } //if not enough args, print help message
            }
            else { message.channel.send(PERMISSION_DENIED_MESSAGE); } //if no permissions, print no permissions message
            return;
        case "hasadmin":
            let UID = getRawUID(args[1]);
            if(args.length > 1 && validateUID(userData, UID)) {
                
                if(hasBotAdminPerm(guild, BOT_ADMIN_ROLE_NAME, UID)) { 
                    message.channel.send("User has " + BOT_ADMIN_ROLE_NAME + " role.");
                }
                else { message.channel.send("User does not have " + BOT_ADMIN_ROLE_NAME + " role."); }
            }
            else { message.channel.send("Invalid user specified."); }
            return;
        default:
            return;
    }
}

module.exports = { BOT_NAME, MIN_BET_AMOUNT, userData }