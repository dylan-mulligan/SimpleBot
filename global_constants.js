const FILEPATH = '../Tokens/SharkPogBot.txt';
const PREFIX = '=';
const BOT_VERSION = "0.2";
const BOT_NAME = "SharkPogBot";
const BOT_ID = "750833421252689930";
const BOT_ADMIN_ROLE_NAME = "SharkPogBotAdmin"
const MIN_BET_AMOUNT = 500;
const PERMISSION_DENIED_MESSAGE = "You do not have permission to use this command!";
const HELP_MESSAGE = "Invalid Arguments, use " + PREFIX + "help <command> for help.";
const COOLDOWNS = {
    rob: 60,
    bankrob: 600,
    fish: 60,
    hunt: 60
};

module.exports = { FILEPATH, PREFIX, BOT_VERSION, BOT_NAME, BOT_ID, BOT_ADMIN_ROLE_NAME, MIN_BET_AMOUNT, PERMISSION_DENIED_MESSAGE, HELP_MESSAGE, COOLDOWNS }