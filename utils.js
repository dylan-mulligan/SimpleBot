const fs = require('fs');
const Discord = require('discord.js');

function validateNumericArgument(args, index) { //validates a value args[index] exists and is numeric
    return (args[index] && !isNaN(args[index]));
}

function getPrintableUserString(UID) { //convert's UID into discord recognizable format (for mentions)
    return "<@!" + UID +">";
}

function getPrintableRoleString(UID) { //convert's UID into discord recognizable format (for mentions)
    return "<@&" + UID +">";
}

function getRawUID(UID) { //converts a mention (discord recognizable format) to raw UID
    return UID.substring(3, UID.length-1);
}

function validateUID(userData, UID) { //validates if user has a valid data entry in user-data.json
    return (userData[UID] !== null && userData[UID] !== undefined);
}

function createUser(userData, UID, userName) { //creates new user in user-data.json with a given UID
    userData[UID] = {
        walletBalance: 5000,
        bankBalance: 1000,
        bankCapacity: 20000,
        username: userName,
        level: 0,
        xp: 0,
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

module.exports = { 
    validateNumericArgument, getPrintableUserString, getRawUID, validateUID, 
    createUser, createEmbed, getToken, getUsername, hasBotAdminPerm, giveAdmin, 
    rollDie, removeAdmin, getPrintableRoleString
}