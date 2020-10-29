const { Card } = require("./objects/Card")
const { Placard } = require("./objects/Placard")
const { ElectionTracker } = require("./objects/ElectionTracker")
const { Track } = require("./objects/Track")
const { shuffle, getPrintableUserString, createArray, 
    createPlayerObject, createEmbed, rollDie, swap, getRawUID } = require("./utils")
const { Player } = require("./objects/Player")

class SecretHitler {
    #players = Array(0);
    #fascists = Array(0);
    #liberals = Array(0);
    #hitler = new Player();
    #gameOver = false;
    #presidentPlacard = new Placard();
    #chancellorPlacard = new Placard();
    #previousPresidentPlacard = new Placard();
    #previousChancellorPlacard = new Placard();
    #liberalTrack = new Track();
    #fascistTrack = new Track();
    #electionTracker = new ElectionTracker();
    #president = new Player();
    #chancellor = new Player();
    playerCount = 0;

    constructor(channel) {
        this.secretHitler(channel);
    }

    async secretHitler(channel) {
        if(await this.startGame(channel)) {
            await this.setup()
            const that = this;
            //give fascists time to look at other fascists and hitler
            setTimeout(function() {
                that.turn(channel);
            }, 5000); //REPLACE 5000 with 10000 or 15000
        }
        /*
        while(!this.#gameOver) {
            await this.turn(channel)
            this.#gameOver = true; //TEMP
        }
        */
        this.endGame()
    }

    async startGame(channel) {
        const message = await channel.send("New game of Secret Hitler starting in 30 seconds. React to join!");
        await message.react('👍');
        const collected = 
        await message.awaitReactions(reaction => reaction.emoji.name == '👍', { max: 10, time: 5000 }) //REPLACE 5000 WITH 30000
        if(collected.size > 0) {
            await collected.array()[0].users.cache.array().forEach(user => {
                if(!user.bot && this.#players.length < 10) {
                    this.#players.push(createPlayerObject(user));
                }
            });
        }
        if(this.#players.length >= 1) { //REPLACE 1 with 5
            let playerNames = ""
            this.#players.forEach(player => {
                playerNames += getPrintableUserString(player.user.id) + " "
            });
            message.edit('Times Up!\nPlayers: ' + playerNames + ". Check your DM's to see your role!");
        }
        else {
            message.edit('Not enough players. Game aborted!').then(msg => msg.delete({"timeout": 15000}));
            return false;
        }
        await message.reactions.removeAll().catch(error => console.error('Failed to remove reactions: ', error));
        return true;
    }

    static createRoleCardDeck(liberalCount, fascistCount, hitlerCount, roleCards) {
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

    async setup() {
        this.playerCount = this.#players.length;
    //create cards

        //create policy cards
        let policyDeck = createArray(6, new Card(false, "Policy Card", "liberal", "Liberal Policy"))
        .concat(createArray(6, new Card(false, "Policy Card", "fascist", "Fascist Policy")));

        //create role cards
        const liberalRoleCard = new Card(false, "Role Card", "liberal", "You are a liberal.");
        const fascistRoleCard = new Card(false, "Role Card", "fascist", "You are a fascist.");
        const hitlerRoleCard = new Card(false, "Role Card", "hitler", "You are Hitler.");
        const roleCards = [liberalRoleCard, fascistRoleCard, hitlerRoleCard];
        let roleDeck;
        switch (this.playerCount) {
            case 1: case 2: case 3: //REPLACE case 1: case 2: WITH case 5:
                roleDeck = SecretHitler.createRoleCardDeck(3, 1, 1, roleCards);
                break;
            case 6:
                roleDeck = SecretHitler.createRoleCardDeck(4, 1, 1, roleCards);
                break;
            case 7:
                roleDeck = SecretHitler.createRoleCardDeck(4, 2, 1, roleCards);
                break;
            case 8:
                roleDeck = SecretHitler.createRoleCardDeck(5, 2, 1, roleCards);
                break;
            case 9:
                roleDeck = SecretHitler.createRoleCardDeck(5, 3, 1, roleCards);
                break;
            case 10:
                roleDeck = SecretHitler.createRoleCardDeck(6, 3, 1, roleCards);
                break;
            default:
                break;
        }

        //create membership cards
        const liberalMembershipCard = new Card(false, "Membership Card", "liberal", "You are a member of the liberal party.");
        const fascistMembershipCard = new Card(false, "Membership Card", "fascist", "You are a member of the fascist party.");

        //create vote cards
        const voteYesCard = new Card(false, "Vote Card", "yes", "Ja!");
        const voteNoCard = new Card(false, "Vote Card", "no", "Nein!");

    //create tracks

        //create liberal track
        this.#liberalTrack = new Track("liberal")

        //create fascist track
        let fascistTrackID;
        if(this.playerCount <= 6) { fascistTrackID = "1" }
        else if(this.playerCount <= 8) { fascistTrackID = "2" }
        else { fascistTrackID = "3" }
        this.#fascistTrack = new Track("fascist", fascistTrackID)


    //create misc game objects

        //placards
        this.#presidentPlacard = new Placard("President");
        this.#chancellorPlacard = new Placard("Chancellor");
        this.#previousPresidentPlacard = new Placard("Previous President");
        this.#previousChancellorPlacard = new Placard("Previous Chancellor");

        //election tracker
        this.#electionTracker = new ElectionTracker();

    //distribute cards

        //shuffle decks
        shuffle(policyDeck)
        shuffle(roleDeck)

        //give role/membership/vote cards
        this.#players.forEach(player => {
            //deal cards
            const roleCard = roleDeck.pop();
            player.deal(roleCard);
            if(roleCard.value == "liberal") { player.deal(liberalMembershipCard); }
            else { player.deal(fascistMembershipCard); }
            player.deal(voteNoCard);
            player.deal(voteYesCard);

            //store player role/membership data
            player.assignRole(roleCard.value)

            //display cards
            player.hand.forEach(async card => {
                await player.user.send(createEmbed(card.title, card.content));
            });
            
            //roll d20 for turn order
            player.roll = rollDie(20);
        });

        //sort players by roll (assign turn order)
        for (let i = 0; i < this.#players.length; i++) {
            for (let j = 0; j < this.#players.length; j++) {
                if(this.#players[i].roll > this.#players[j].roll) {
                    swap(this.#players[i], i ,j)
                }
            }
        }ERR //test this

    //#region tests
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
        if(false) {
            this.#players.forEach(player => {
                console.log(player.hand)
            });
        }
    //#endregion
    }

    async turn(channel) {
    //#region election

        //pass president placard to next president candidate
        if(this.#presidentPlacard.PID !== null) {
            //moves president placard to next player and returns the 
            //PIDs of the last president and new president
            const players = this.#presidentPlacard.moveNext(this.#players);

            //gets the players by PID
            const lastPres = this.#players.find(p => p.user.id == players[0]);
            const newPres = this.#players.find(p => p.user.id == players[1]);
            this.#president = newPres;
            
            //gives relevant placards to players
            lastPres.givePlacard(this.#presidentPlacard);
            newPres.givePlacard(this.#previousPresidentPlacard);
            this.#previousPresidentPlacard.moveTo(lastPres.user.id);
        }
        else { 
            //newPres is first player
            const newPres = this.#players[0];
            this.#president = newPres;

            //president placard assigned newPres PID
            this.#presidentPlacard.moveTo(newPres.user.id);

            //gives first player president placard
            newPres.givePlacard(this.#presidentPlacard);
        }
        const predidentMention = getPrintableUserString(this.#president.user.id);
        channel.send("The current presidential candidate is " + predidentMention);

        //president chooces chancellor candidtate (cannot be previous pres or chancellor)
        await channel.send(predidentMention + " Please @mention your choice for the next candidate for chancellor within the next 30 seconds");
        let collected = await channel.awaitMessages(m => m.author.id == this.#president.user.id, {time: 5000}); //REPLACE 5000 with 30000
        const first = collected.first();
        let nominatedChancellor;
        if(first !== undefined) {
            nominatedChancellor = getRawUID(first.content);
        }
        const chancellorMention = getPrintableUserString(nominatedChancellor);
        if(nominatedChancellor !== null) {
            await channel.send("You have nominated " + chancellorMention);
        }

        //voting session
        const message = await channel.send("Please react with your vote for " + chancellorMention + " as the next candidate for chancellor within the next 30 seconds");
        await message.react('👍')
        await message.react('👎')
        collected = await message.awaitReactions(reaction => (reaction.emoji.name == '👍' || reaction.emoji.name == '👎'), { max: 10, time: 5000 }) //REPLACE 5000 WITH 30000
        let yesVotes = 0;
        let noVotes = 0;
        console.log(collected)
        console.log(collected.array()[0].users.cache.array())
        collected.map(reaction => {
            if(reaction.emoji.name == '👍') {
                reaction.users.cache.map(user => {
                    if(!user.bot) {
                        yesVotes += 1;
                    }
                })
            }
            else if(reaction.emoji.name == '👎'){
                reaction.users.cache.map(user => {
                    if(!user.bot) {
                        noVotes += 1;
                    }
                })
            }

        });
        //if vote passes
        if(yesVotes > noVotes) {
            this.#chancellor = this.#players.find(player => player.user.id == nominatedChancellor);
            this.#chancellor.givePlacard(this.#chancellorPlacard)
            this.#chancellorPlacard.moveTo(this.#chancellor);
        }
        //if vote fails
        else {
            this.#electionTracker.increase()
            return false;
        }
    //#endregion
    //legislative session

        //president turn

        //chancellor turn

    }

    endGame() {
        delete this;
    }
}

module.exports = { SecretHitler }