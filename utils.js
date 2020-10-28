const fs = require('fs');
const Discord = require('discord.js');
const { COOLDOWNS } = require("./global_constants");

function validateNumericArgument(args, index) { //validates a value args[index] exists and is numeric
    return (args[index] && !isNaN(args[index]));
}

function getPrintableUserString(UID) { //convert's UID into discord recognizable format (for mentions)
    return "<@!" + UID + ">";
}

function getPrintableRoleString(role) { //convert's role into discord recognizable format (for role mentions)
    return "<@&" + role + ">";
}

function getRawUID(UID) { //converts a mention (discord recognizable format) to raw UID
    if(UID.length > 5){
        return UID.substring(3, UID.length-1);
    }
    else { return null; }
}

function validateUID(userData, UID) { //validates if a user with given UID has a valid data entry in given userData
    return (userData[UID] !== null && userData[UID] !== undefined);
}

function createUser(userData, UID, userName) { //creates new user in given userData with a given UID and userName
    userData[UID] = {
        walletBalance: 5000,
        bankBalance: 1000,
        bankCapacity: 20000,
        username: userName,
        level: 0,
        xp: 0,
        cooldowns: {
            search: 0,
            hunt: 0,
            fish: 0,
            rob: 0,
            bankrob: 0
        },
        inventory: {}
    }
}

function createEmbed(title, description, thumbnail=null, url=null) { //creates a discord embed object and returns it
    let embed = new Discord.MessageEmbed()
    .setTitle(title)
    .setDescription(description)
    .setImage(thumbnail)
    .setURL(url);
    return embed;
}

function getToken(filePath) { //retrieves bot token (password) from external file
    try {
        let token = fs.readFileSync(filePath, 'utf8');
        return token;
    } 
    catch(e) {
        console.log('Error:', e.stack);
    }
}

function getUsername(userData, UID) { //validates the given UID and returns the username of the specified user
    if(!validateUID(userData, UID)) { console.log("Invalid user specified."); return; }
    return userData[UID].username
}

function hasBotAdminPerm(guild, roleName, UID) { //checks if given user has bot admin role
    let ret = false
    guild.members.cache.each(member => {
        if(member.id === UID) {
            member.roles.cache.each(r => { 
                if(r.name === roleName) { ret = true; }
            });
        }
    });
    return ret;
}

function giveAdmin(userData, guild, roleName, message, args) { //gives a player the bot admin role
    let UID = getRawUID(args[1])
    if(!validateUID(userData, UID)) { message.channel.send("Invalid user specified."); return; }
    let member = message.mentions.members.first();
    if (!member.roles.cache.some(role => role.name === roleName)) {
        let role = guild.roles.cache.find(role => role.name === roleName);
        member.roles.add(role)
        console.log("User " + UID + " has been assigned the " + roleName + " role!");
        message.channel.send(getPrintableUserString(UID) + " has been given " + roleName + ".")
        return;
    }
    else {  message.channel.send("User already has this role!"); return; } //if not enough args, print help message
}

function removeAdmin(userData, guild, roleName, message, args) { //gives a player the bot admin role
    let UID = getRawUID(args[1])
    if(!validateUID(userData, UID)) { message.channel.send("Invalid user specified."); return; }
    let member = message.mentions.members.first();
    if (member.roles.cache.some(role => role.name === roleName)) {
        let role = guild.roles.cache.find(role => role.name === roleName);
        member.roles.remove(role)
        console.log("Role " + roleName + " has been removed from user " + UID);
        message.channel.send(roleName + " has been removed from " + getPrintableUserString(UID) + "." )
        return;
    }
    else {  message.channel.send("User does not have this role!"); return; } //if not enough args, print help message
}

function rollDie(sides) { //"rolls a die" with given sides and returns the result
    return Math.round(Math.random() * sides);
}

function validateMemory(userData, UID) {
    for (const key in userData["0000"]) {
        if (!userData[UID].hasOwnProperty(key)) {
            console.log("User " + UID + " missing " + key)
            console.log("Adding " + key + " to user " + UID)
            userData[UID][key] = userData["0000"][key]
        }
    }
}

function offCooldown(userData, UID, key) { //TODO
    if(!validateUID(userData, UID)) { console.log("Invalid user specified: " + UID); return false; }
    if(!userData[UID].cooldowns.hasOwnProperty(key)) { console.log("User " + UID + " does not have property: " + key); return false; }
    if(!COOLDOWNS.hasOwnProperty(key)) { console.log("Invalid property specified: " + key); return false; }
    return Date.now() - userData[UID].cooldowns[key] >= COOLDOWNS[key] * 1000
}

function onCooldown(userData, message, UID, key, COOLDOWNS) {
    if(!validateUID(userData, UID)) { return; }
    if(!userData[UID].cooldowns.hasOwnProperty(key)) { console.log("User " + UID + " does not have property: " + key); return false; }
    remainingCooldown = COOLDOWNS[key] - (Date.now() - userData[UID].cooldowns[key]) / 1000
    totalCooldown = COOLDOWNS[key]
    message.channel.send("You must wait " + remainingCooldown.toFixed(1) + " seconds to " + key + ". (Total cooldown: " + totalCooldown + " seconds)")
}

function randomInt(min, max) {
    if(!Number.isInteger(min) || !Number.isInteger(max)) { return; }
    return Math.floor(min + Math.random() * (max - min));
}

function randomChance(chance) {
    return Math.random() <= chance
}

function shuffle(deck) {
    const length = deck.length;
    for (let i = 0; i < length; i++) {
        let j = randomInt(0, length);
        swap(deck, i, j);
    }
}

function swap(array, i, j) {
    const length = array.length;
    if(i < length && j < length) {
        temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function createArray(size, value) {
    let deck = Array(size)
    for (let i = 0; i < deck.length; i++) {
        deck[i] = value
    }
    return deck;
}

module.exports = { 
    validateNumericArgument, getPrintableUserString, getRawUID, validateUID, 
    createUser, createEmbed, getToken, getUsername, hasBotAdminPerm, giveAdmin, 
    rollDie, removeAdmin, getPrintableRoleString, validateMemory, offCooldown,
    randomInt, randomChance, onCooldown, shuffle, createArray
}