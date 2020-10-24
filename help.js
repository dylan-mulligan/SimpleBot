const { createEmbed } = require("./utils")
function help(PREFIX, MIN_BET_AMOUNT, message, args) {
    if(args.length > 1) {
        commandHelp(message, PREFIX, MIN_BET_AMOUNT, args[1])
    }
    else {
        basicHelp(message)
    }
    return;
}

function basicHelp(message) {
    const title = "Commands";
    const description = 
    "``ping`` ``roll`` ``clear`` ``stats`` ``balance`` \
    ``gamble`` ``blackjack`` ``version`` ``help`` ``deposit`` \
    ``withdraw`` ``share`` \
    \nUse help <command> for specific command help.";
    message.channel.send(createEmbed(title, description));
    return;
}

function commandHelpFormat(command, description, usage, aliases, PREFIX) {
    let title = PREFIX + command + " info";
    let desc = 
    "**Description:**\n" + description + "\n\n" +
    "**Usage:**\n" + usage + "\n\n" +
    "**Aliases:**\n" + aliases;

    return createEmbed(title, desc);
}

function commandHelp(message, PREFIX, MIN_BET_AMOUNT, command) {
    let embed = null;
    let description = null;
    let usage = null;
    let aliases = null;
    switch (command) {
        case "ping": //pong
            description = "Pong!";
            usage = PREFIX + command;
            aliases = "``ping``";
            break;
        case "roll": //calls roll function
            description = "Rolls specified number of die.";
            usage = PREFIX + command + " <number of die>";
            aliases = "``roll``";
            break;
        case "clear": //clears args[1] amount of messages (up to 100)
            description = "Clears the last specified number of messages.";
            usage = PREFIX + command + " <number of messages>";
            aliases = "``clear``";
            break;
        case "stats": //calls stats function
            description = "Displays the stats of either you or a specified user.";
            usage = PREFIX + command + " (optional) <user>";
            aliases = "``stats``";
            break;
        case "bal": case "balance": //calls getBalances function
            description = "Displays the balance of either you or a specified user.";
            usage = PREFIX + command + " (optional) <user>";
            aliases = "``balance``, ``bal``";
            break;
        case "gamble": //calls gamble function
            description = 
            "Gambles a specified amount (greater than " + MIN_BET_AMOUNT + ") \
            by rolling 2 die for both the player and the bot. Highest score wins.";
            usage = PREFIX + command + "<bet amount>";
            aliases = "``gamble``";
            break;
        case "blackjack": //calls blackjack function
            description = 
            "Gambles a specified amount (greater than " + MIN_BET_AMOUNT + ") \
            on a game of blackjack against the bot. Highest score under 22 wins.";
            usage = PREFIX + command + "<bet amount>";
            aliases = "``blackjack``";
            break;
        case "version": case "ver": //displays bot version
            description = "Displays the version of the bot.";
            usage = PREFIX + command;
            aliases = "``version``, ``ver``";
            break;
        case "help": case "commands": //displays command help page
            description = "Displays a list of commands available. You can use " +
            PREFIX + "help <command> to see specific command help.";
            usage = PREFIX + command + " (optional) <command>";
            aliases = "``help``, ``commands``";
            break;
        case "dep": case "deposit": //calls deposit function
            description = "Deposits a specified amount of coins into your \
            bank. You can use \"all\" or \"max\" to deposit all of your coins.";
            usage = PREFIX + command + " <number of coins>";
            aliases = "``deposit``, ``dep``";
            break;
        case "with": case "withdraw": //calls withdraw function
            description = "Withdraws a specified amount of coins from your \
            bank. You can use \"all\" or \"max\" to withdraw all of your coins.";
            usage = PREFIX + command + " <number of coins>";
            aliases = "``withdraw``, ``with``";
            break;
        case "share": //calls share function
            description = "Shares a specified amount of coins from your \
            wallet with another specified user. You can use \"all\" or \"max\" \
            to share all of your coins.";
            usage = PREFIX + command + " <recipient> <number of coins>";
            aliases = "``share``";
            break;
        default:
            return;
    }
    embed = commandHelpFormat(command, description, usage, aliases, PREFIX)
    message.channel.send(embed);
}

module.exports = { help }