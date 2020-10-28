const { Card } = require("./objects/Card")
const { Placard } = require("./objects/Placard")
const { ElectionTracker } = require("./objects/ElectionTracker")
const { Player } = require("./objects/Player")
const { Track } = require("./objects/Track")
const { shuffle, getPrintableUserString, createArray } = require("./utils")

let players = Array(0)
let playerCount;

async function secretHilter(channel) {
    await startGame(channel)
    await setup()
}

async function startGame(channel) {
    const message = await channel.send("New game of Secret Hitler starting in 30 seconds. React to join!");
    await message.react('👍');
    const collected = 
    await message.awaitReactions(reaction => reaction.emoji.name == '👍', { max: 10, time: 5000 }) //REPLACE 5000 WITH 30000
    await collected.array()[0].users.cache.array().forEach(user => {
        if(!user.bot && players.length < 10) {
            players.push(createPlayerObject(user));
        }
    });
    if(players.length >= 1) {
        let playerNames = ""
        players.forEach(player => {
            playerNames += getPrintableUserString(player.id) + " "
        });
        message.edit('Times Up!\nPlayers: ' + playerNames).then(msg => msg.delete({"timeout": 10000}));
    }
    else {
        message.edit('Not enough players. Game aborted!').then(msg => msg.delete({"timeout": 10000}));
    }
    await message.reactions.removeAll().catch(error => console.error('Failed to remove reactions: ', error));
}

function createPlayerObject(user) {
    return new Player(user.username, user.id)
}

function createRoleCardDeck(liberalCount, fascistCount, hitlerCount, roleCards) {
    let deck = Array(0);
    for (let i = 0; i < liberalCount; i++) {
        deck.push(roleCards[0])
    }
    for (let i = 0; i < fascistCount; i++) {
        deck.push(roleCards[1])
    }
    for (let i = 0; i < hitlerCount; i++) {
        deck.push(roleCards[2])
    }
    return deck
}

async function setup() {
    playerCount = players.length;
//create cards

    //create policy cards
    let policyDeck = createArray(6, new Card(false, "liberal", "Liberal Policy"))
    .concat(createArray(6, new Card(false, "fascist", "Fascist Policy")));

    //create role cards
    const liberalRoleCard = new Card(false, "liberal", "You are a liberal.");
    const fascistRoleCard = new Card(false, "fascist", "You are a fascist.");
    const hitlerRoleCard = new Card(false, "hitler", "You are Hitler.");
    const roleCards = [liberalRoleCard, fascistRoleCard, hitlerRoleCard];
    let roleDeck;
    switch (playerCount) {
        case 1: //REPLACE 1 WITH 5
            roleDeck = createRoleCardDeck(3, 1, 1, roleCards);
            break;
        case 6:
            roleDeck = createRoleCardDeck(4, 1, 1, roleCards);
            break;
        case 7:
            roleDeck = createRoleCardDeck(4, 2, 1, roleCards);
            break;
        case 8:
            roleDeck = createRoleCardDeck(5, 2, 1, roleCards);
            break;
        case 9:
            roleDeck = createRoleCardDeck(5, 3, 1, roleCards);
            break;
        case 10:
            roleDeck = createRoleCardDeck(6, 3, 1, roleCards);
            break;
        default:
            break;
    }

    //create membership cards
    const liberalMembershipCard = new Card(false, "liberal", "You are a member of the liberal party.");
    const fascistMembershipCard = new Card(false, "fascist", "You are a member of the fascist party.");

    //create vote cards
    const voteYesCard = new Card(false, "yes", "Ja!");
    const voteNoCard = new Card(false, "no", "Nein!");

//create tracks

    //create liberal track
    const liberalTrack = new Track("liberal")

    //create fascist track
    let fascistTrackID;
    if(playerCount <= 6) { fascistTrackID = "1" }
    else if(playerCount <= 8) { fascistTrackID = "2" }
    else { fascistTrackID = "3" }
    const fascistTrack = new Track("fascist", fascistTrackID)


//create misc game objects

    //placards
    const presidentPlacard = new Placard("President");
    const chancellorPlacard = new Placard("Chancellor");
    const previousPresidentPlacard = new Placard("Previous President");
    const previousChancellorPlacard = new Placard("Previous Chancellor");

    //election tracker
    const electionTracker = new ElectionTracker();

//distribute cards

    //shuffle decks
    shuffle(policyDeck)
    shuffle(roleDeck)

    //give role/membership/vote cards
    players.forEach(player => {
        const card = roleDeck.pop();
        player.deal(card);
        if(card.value == "fascist") { player.deal(fascistMembershipCard); }
        else { player.deal(liberalMembershipCard); }
        player.deal(voteNoCard);
        player.deal(voteYesCard);
    });

//tests
    if(false) {
        console.log(
            policyDeck, liberalRoleCard.content, fascistRoleCard.content, hitlerRoleCard.content,
            liberalMembershipCard.content, fascistMembershipCard.content, presidentPlacard.title,
            chancellorPlacard.title, previousPresidentPlacard.title, previousChancellorPlacard.title,
            electionTracker.count, voteNoCard.content, voteYesCard.content, fascistTrack.spaces, 
            liberalTrack.spaces
        );
    }
    if(false) {
        console.log("FASCIST");
        fascistTrack.spaces.forEach(space => {
            console.log(space);
        });
        console.log("LIBERAL");
        liberalTrack.spaces.forEach(space => {
            console.log(space);
        });
    }
    if(true) {
        players.forEach(player => {
            console.log(player.hand)
        });
    }
}

module.exports = { secretHilter }