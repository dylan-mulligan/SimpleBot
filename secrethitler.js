const { Card } = require("./objects/Card")
const { Placard } = require("./objects/Placard")
const { ElectionTracker } = require("./objects/ElectionTracker")
const { Track } = require("./objects/Track")
const { shuffle, getPrintableUserString, createArray, 
    createPlayerObject, createEmbed, rollDie, swap, getRawUID, 
    getPlayerNames, createUUID, validateNumericArgument, randomInt, reactYesOrNo } = require("./utils")
const { Player } = require("./objects/Player")

class SecretHitler {
    //#region game properties

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
    #policyDeck = [];
    #confirmedPlayers = [];
    gameID = null;
    playerCount = 0;

    //#endregion

    constructor(channel) {
        this.secretHitler(channel);
    }

    async secretHitler(channel) {
        this.gameID = createUUID()
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
            const playerNames = getPlayerNames(this.#players);
            message.edit('Times Up!\nPlayers: ' + playerNames + ". Check your DM's to see your role!");
        }
        else {
            message.edit('Not enough players. Game aborted!').then(msg => msg.delete({"timeout": 15000})).catch(e => console.log(e));
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
        this.#policyDeck = createArray(6, new Card(false, "Policy Card", "liberal", "Liberal Policy"))
        .concat(createArray(11, new Card(false, "Policy Card", "fascist", "Fascist Policy")));

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
        //const voteYesCard = new Card(false, "Vote Card", "yes", "Ja!");
        //const voteNoCard = new Card(false, "Vote Card", "no", "Nein!");

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
        shuffle(this.#policyDeck)
        shuffle(roleDeck)

        //give role/membership/vote cards
        this.#players.forEach(player => {
            //deal cards
            const roleCard = roleDeck.pop();
            player.deal(roleCard);
            if(roleCard.value == "liberal") { player.deal(liberalMembershipCard); }
            else { player.deal(fascistMembershipCard); }
            //player.deal(voteNoCard);
            //player.deal(voteYesCard);

            //store player role/membership data
            player.assignRole(roleCard.value)

            //display cards
            player.hand.forEach(async card => {//TODO: SEND CARD IMAGES INSTEAD
                await player.user.send(createEmbed(card.title, card.content));
            });
            
            //roll d20 for turn order
            player.roll = rollDie(20);
        });

        //sort players by roll (assign turn order)
        for (let i = 0; i < this.playerCount; i++) {
            for (let j = 0; j < this.playerCount; j++) {
                if(this.#players[i].roll > this.#players[j].roll) {
                    swap(this.#players[i], i ,j)
                }
            }
        }

    //#region tests
        if(false) {
            console.log(
                this.#policyDeck, liberalRoleCard.content, fascistRoleCard.content, hitlerRoleCard.content,
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
        while(!this.#gameOver) {
        //election
            await this.election(channel)
        //legislative session
            const power = await this.legislative(channel)
        //executive action
            const that = this
            setTimeout(function() {
                that.executive(channel, power);
            }, 10000); //REPLACE 5000 with 10000 or 15000
        }
    }

    async election(channel) {
        if(this.#gameOver) { return null; }
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

        //president chooces chancellor candidate (cannot be previous pres or chancellor)

        //checks for previous chancellor/president status
        let eligiblePlayers = [];
        let ineligiblePlayers = [];
        this.#players.forEach(player => {
            if(player.placard == null) { eligiblePlayers.push(player); }
            else { ineligiblePlayers.push(player); }
            if(player.notHitler) { this.#confirmedPlayers.push(player) }
        });
        const eligiblePlayerNames = getPlayerNames(eligiblePlayers);
        const ineligiblePlayerNames = getPlayerNames(ineligiblePlayers);
        const confirmedPlayerNames = getPlayerNames(this.#confirmedPlayers);

        //prompts president for eligible candidate
        await channel.send(predidentMention + " Please @mention your choice for the next candidate for chancellor within the next 30 seconds \
        \nEligible Players: " + eligiblePlayerNames + "\nIneligible Players: " + ineligiblePlayerNames + "\nConfirmed NOT Hitler players: " + confirmedPlayerNames);
        let collected = await channel.awaitMessages(m => m.author.id == this.#president.user.id, {time: 5000}); //REPLACE 5000 with 30000
        const first = collected.first();
        let nominatedChancellor;
        let validChancellor = false;
        if(first !== undefined) {
            nominatedChancellor = this.#players.filter(p => p.user.id == getRawUID(first.content))[0];
            eligiblePlayers.forEach(player => {
                if(player.user.id == nominatedChancellor.user.id) {
                    validChancellor = true;
                }
            });
        }
        if(!validChancellor) {
            await channel.send("Invalid choice for chancellor! The next valid player will be nominated instead.");
            const presidentIndex = this.#players.findIndex(player => player.user.id == this.#president.user.id);
            let counter = 1
            while (true) {
                if(this.playerCount > presidentIndex + 1 + counter) { presidentIndex = -1; }
                if(this.#players[presidentIndex + counter] !== undefined && this.#players[presidentIndex + counter].placard !== null) { counter++; }
                else if(counter > 10) { break; }
                else { break; }
            }
            nominatedChancellor = this.#players[presidentIndex + counter];
        }
        if(nominatedChancellor !== null) {
            await channel.send("You have nominated " + getPrintableUserString(nominatedChancellor.user.id));
        }

        //voting session
        await this.vote(channel, nominatedChancellor, "chancellor")

        //check if fascists win
        if(this.#fascistTrack.filled >= 3) {
            if(this.#chancellor.user.id == this.#hitler.user.id) {
                channel.send("Fascists win! Hitler has been elected chancellor when 3 or more fascist policies have been played.")
                this.#gameOver = true
            }
            else {
                channel.send(chancellorMention + " is NOT Hitler!")
                this.#chancellor.notHitler = true
            }
        }
    }

    async vote(channel, candidate, position) {
        if(candidate == undefined || candidate == null) { 
            console.log("Game " + this.gameID + ": Invalid candidate.")
            return null;
        }
        //voting session
        const message = await channel.send("Please react with your vote for " + getPrintableUserString(candidate.user.id) + " as the next candidate for " + position + " within the next 30 seconds");
        const votes = await reactYesOrNo(message)

        //if vote passes
        if(votes[0] > votes[1]) {
            if(position == "chancellor") {
                this.#chancellor = candidate;
                if(this.#chancellor !== undefined) {
                    this.#chancellor.givePlacard(this.#chancellorPlacard)
                    this.#chancellorPlacard.moveTo(this.#chancellor);
                    channel.send("Vote Passed!\nPresident: " + getPrintableUserString(this.#president.user.id) + "\nChancellor: " + getPrintableUserString(this.#chancellor.user.id))
                }
                else {
                    console.log("Game " + this.gameID + ": Undefined chancellor nominee.")
                    return;
                }
            }
            else {
                this.#president = candidate;
                if(this.#president !== undefined) {
                    this.#president.givePlacard(this.#presidentPlacard)
                    this.#presidentPlacard.moveTo(this.#president);
                    channel.send("Vote Passed!\nPresident: " + getPrintableUserString(this.#president.user.id))
                }
                else {
                    console.log("Game " + this.gameID + ": Undefined president nominee.")
                    return;
                }
            }
            this.#electionTracker.reset()
            
        }
        //if vote fails
        else {
            this.#electionTracker.increase();
            channel.send("Vote Failed! Failed election tracker at ``" + this.#electionTracker.count + "/3``");
            return false;
        }
    }

    async legislative(channel) { //TODO: TEST ALL OF THIS
        if(this.#gameOver) { return null; }
    //president turn

        //draw 3 policy cards
        let policyCards = []
        for (let i = 0; i < 3; i++) { policyCards.push(this.#policyDeck.pop()); }

        //send president cards
        await channel.send(getPrintableUserString(this.#president.user.id) + " has drawn 3 cards, they will discard 1 card and pass the remaining 2 to " + getPrintableUserString(this.#chancellor.user.id))
        policyCards.forEach(async card => { //TODO: SEND CARD IMAGES INSTEAD
            const message = await this.#president.user.send(createEmbed(card.title, card.content));
            message.delete({"timeout": 5000}).catch(e => console.log(e)); //REPLACE 5000 with 20000
        });

        //president chooses card to discard
        let discardAttempts = 0
        let discardIndex = -1;
        while (true) {
            const message = await this.#president.user.send("Enter card to discard (1, 2, or 3)").catch(e => console.log(e));
            const collected = await message.channel.awaitMessages(() => true, {max: 1, time: 5000}).catch(e => console.log(e)); //REPLACE 5000 with 20000
            const first = collected.first();
            if(first !== undefined && validateNumericArgument([first.content], 0)) {
                switch (parseInt(first.content)) {
                    case 1:
                        discardIndex = 0;
                        break;
                    case 2:
                        discardIndex = 1;
                        break;
                    case 3:
                        discardIndex = 2;
                        break;
                    default:
                        break;
                }
            }
            if(discardIndex >= 0) { break; }
            await message.channel.send("Invalid card chosen, try again!")
            discardAttempts++;
            if(discardAttempts > 2) {
                await message.channel.send("No valid choice has been made, choosing random card to discard.")
                discardIndex = randomInt(0, policyCards.length-1)
                break;
            }
        }
        
        //discard chosen card
        let removedCard = policyCards.splice(discardIndex, 1)[0];
        await this.#president.user.send("Discarding this card.");
        let discardedCardMessage = await this.#president.user.send(createEmbed(removedCard.title, removedCard.content));
        discardedCardMessage.delete({"timeout": 5000}).catch(e => console.log(e)); //REPLACE 5000 with 20000

    //chancellor turn

        //send remaining cards to chancellor
        policyCards.forEach(async card => { //TODO: SEND CARD IMAGES INSTEAD
            const message = await this.#chancellor.user.send(createEmbed(card.title, card.content));
            message.delete({"timeout": 5000}).catch(e => console.log(e)); //REPLACE 5000 with 20000
        });

        //chancellor decides on veto
        if(this.#fascistTrack.filled == 5) { //TODO: TEST THIS
            const message = await this.#chancellor.user.send("Since there are 5 fascist policy cards played, you, as the chancellor, \
            have the option to veto the current legislative session. React with your decision");
            const votes = await reactYesOrNo(message)
            if(votes[0] > votes[1]) { //TODO: VETO SESSION
                //veto starts
                console.log("VETO TIME");
            }
            else {
                await message.channel.send("You have opted not to veto the current legislative session.")
            }
        }

        //chancellor chooses card to discard
        discardAttempts = 0
        discardIndex = -1;
        while (true) {
            const message = await this.#chancellor.user.send("Enter card to discard (1 or 2)")
            const collected = await message.channel.awaitMessages(() => true, {max: 1, time: 5000}); //REPLACE 5000 with 30000
            const first = collected.first();
            if(first !== undefined && validateNumericArgument([first.content], 0)) {
                switch (parseInt(first.content)) {
                    case 1:
                        discardIndex = 0;
                        break;
                    case 2:
                        discardIndex = 1;
                        break;
                    default:
                        break;
                }
            }
            if(discardIndex >= 0) { break; }
            await message.channel.send("Invalid card chosen, try again!")
            discardAttempts++;
            if(discardAttempts > 2) {
                await message.channel.send("No valid choice has been made, choosing random card to discard.")
                discardIndex = randomInt(0, policyCards.length-1)
                break;
            }
        }

        //discard chosen card
        removedCard = policyCards.splice(discardIndex, 1)[0];
        await this.#chancellor.user.send("Discarding this card.") //TODO: FIX THIS
        discardedCardMessage = await this.#chancellor.user.send(createEmbed(removedCard.title, removedCard.content));
        discardedCardMessage.delete({"timeout": 5000}).catch(e => console.log(e)); //REPLACE 5000 with 20000

        //play remaining card
        const playedCard = policyCards.pop();
        let power;
        if(playedCard.value == "fascist") {
            power = this.#fascistTrack.fillNextSpace(playedCard)
            await channel.send("A fascist card has been played! (" + this.#fascistTrack.filled + "/6)")
        }
        else {
            power = this.#liberalTrack.fillNextSpace(playedCard)
            await channel.send("A liberal card has been played! (" + this.#liberalTrack.filled + "/6)")
        }

        //check for game end
        if(this.#fascistTrack.filled == 6) {
            await channel.send("Fascists win! 6 Fascist policies have been inacted.")
            this.#gameOver = true
        }
        else if(this.#liberalTrack.filled == 6) {
            await channel.send("Liberals win! 6 Liberal policies have been inacted.")
            this.#gameOver = true
        }

        return(power)

    }

    async executive(channel, power) {
        if(this.#gameOver) { return null; }
        //if power space activated
        if(power !== undefined && power !== null) {
            switch (power) {
                case "inspectPlayer":
                    await this.inspectPlayer(channel)
                    break;
                case "inspectCards":
                    await this.inspectCards(channel)
                    break;
                case "killPlayer":
                    await this.killPlayer(channel)
                    break;
                case "specialElection":
                    await this.specialElection(channel)
                    break;
                default:
                    break;
            }
        }
    }

    async inspectCards(channel) {
        //prompts the president that they have drawn 3 cards
        await channel.send(getPrintableUserString(this.#president.user.id) + " has the power of ``Inspect Cards``, they have drawn 3 cards, and will inspect them then place them back on the top of the deck.");

        //draw 3 cards
        let policyCards = [];
        for (let i = 0; i < 3; i++) { policyCards.push(this.#policyDeck.pop()); }

        //send president cards
        await this.#president.user.send("Here are the top 3 cards from the draw pile, you have 30sec to inspect them.")
        policyCards.forEach(async card => { //TODO: SEND CARD IMAGES INSTEAD
            await this.#president.user.send(createEmbed(card.title, card.content)).delete({"timeout": 5000}).catch(e => console.log(e)); //REPLACE 5000 with 30000
        });

        //return cards to deck
        for (let i = 0; i < 3; i++) { this.#policyDeck.push(policyCards.pop()); }
    }

    async inspectPlayer(channel) {
        //gets eligible, ineligible and confirmed NOT Hitler players
        const eligiblePlayerNames = getPlayerNames(this.#players.filter(p => p.user.id !== this.#president.user.id)) //all players besides the president
        const ineligiblePlayerNames = getPrintableUserString(this.#president.user.id)
        const confirmedPlayerNames = getPlayerNames(this.#confirmedPlayers);

        //prompts the president to mention a player to insepct (other than themself)
        await channel.send(getPrintableUserString(this.#president.user.id) + " has the power of ``Inspect Player``, @mention any eligible player to inspect within the next 30 seconds." +
        "\nEligible Players: " + eligiblePlayerNames + "\nIneligible Players: " + ineligiblePlayerNames + 
        "\nConfirmed NOT Hitler players: " + confirmedPlayerNames)
        
        //gives president 2 attempts to mention a valid player to inspect
        let mentionAttempts = 0
        let inspectedPlayer = null;
        while(true) {
            let collected = await channel.awaitMessages(m => m.author.id == this.#president.user.id, {max: 1, time: 5000}); //REPLACE 5000 with 30000
            const first = collected.first();
            if(first !== undefined) {
                inspectedPlayer = this.#players.filter(p => p.user.id == getRawUID(first.content))[0];
                if(inspectedPlayer.user.id == this.#president.user.id) { inspectedPlayer = null; }
            }

            if(inspectedPlayer !== null) { break; }

            await channel.send("Invalid player chosen, try again!")
            mentionAttempts++;

            if(mentionAttempts > 2) {
                await channel.send("No valid choice has been made, choosing random player to inspect.")
                let tempInspectedPlayer = null;
                let randomAttempts = 0
                while((tempInspectedPlayer == null || tempInspectedPlayer.user.id == this.#president.user.id) && randomAttempts < 10) {
                    const randomIndex = randomInt(0, this.playerCount)
                    console.log(randomIndex)
                    tempInspectedPlayer = this.#players[randomIndex]
                    randomAttempts++;
                }
                inspectedPlayer = tempInspectedPlayer
                break;
            }
        }

        //announce selected player
        await channel.send(getPrintableUserString(inspectedPlayer.user.id) + " will be inspected by " + getPrintableUserString(this.#president.user.id) + ".")

        //inspect selected player
        const membershipCard = inspectedPlayer.hand[1];
        await this.#president.user.send("You have recieved " + inspectedPlayer.user.username + "'s membership card. It will automatically disappear in 30 seconds.")
        const message = await this.#president.user.send(createEmbed(membershipCard.title, membershipCard.content))
        message.delete({"timeout": 5000}).catch(e => console.log(e)); //REPLACE 5000 with 30000
    }

    async specialElection(channel) {
        //gets eligible, ineligible and confirmed NOT Hitler players
        const eligiblePlayerNames = getPlayerNames(this.#players.filter(p => p.user.id !== this.#president.user.id)) //all players besides the president
        const ineligiblePlayerNames = getPrintableUserString(this.#president.user.id)
        const confirmedPlayerNames = getPlayerNames(this.#confirmedPlayers);

        //prompts the president to mention a player to nominate (other than themself)
        await channel.send(getPrintableUserString(this.#president.user.id) + " has the power of ``Special Election``, @mention any eligible player to nominate within the next 30 seconds." +
        "\nEligible Players: " + eligiblePlayerNames + "\nIneligible Players: " + ineligiblePlayerNames + 
        "\nConfirmed NOT Hitler players: " + confirmedPlayerNames)
        
        //get president's choice
        let mentionAttempts = 0
        let presidentialCandidate = null;
        while(true) {
            let collected = await channel.awaitMessages(m => m.author.id == this.#president.user.id, {max: 1, time: 5000}); //REPLACE 5000 with 30000
            const first = collected.first();
            if(first !== undefined) {
                inspectedPlayer = this.#players.filter(p => p.user.id == getRawUID(first.content))[0];
                if(inspectedPlayer.user.id == this.#president.user.id) { inspectedPlayer = null; }
            }

            if(inspectedPlayer !== null) { break; }

            await channel.send("Invalid player chosen, try again!")
            mentionAttempts++;

            if(mentionAttempts > 2) {
                await channel.send("No valid choice has been made, choosing random player to nominate.")
                let tempPresidentialCandidate = null;
                let randomAttempts = 0
                while((tempPresidentialCandidate == null || tempPresidentialCandidate.user.id == this.#president.user.id) && randomAttempts < 10) {
                    tempPresidentialCandidate = this.#players[randomInt(0, this.playerCount-1)]
                    randomAttempts++;
                }
                presidentialCandidate = tempPresidentialCandidate
                break;
            }
        }

        //voting session
        await this.vote(channel, presidentialCandidate, "president")
    }

    async killPlayer(channel) {
        //gets eligible, ineligible and confirmed NOT Hitler players
        const eligiblePlayerNames = getPlayerNames(this.#players.filter(p => p.user.id !== this.#president.user.id)) //all players besides the president
        const ineligiblePlayerNames = getPrintableUserString(this.#president.user.id)
        const confirmedPlayerNames = getPlayerNames(this.#confirmedPlayers);

        //prompts the president to mention a player to insepct (other than themself)
        await channel.send(getPrintableUserString(this.#president.user.id) + " has the power of ``Kill Player``, @mention any eligible player to kill within the next 30 seconds." +
        "\nEligible Players: " + eligiblePlayerNames + "\nIneligible Players: " + ineligiblePlayerNames + 
        "\nConfirmed NOT Hitler players: " + confirmedPlayerNames)
        let mentionAttempts = 0
        let killedPlayer = null;
        while(true) {
            let collected = await channel.awaitMessages(m => m.author.id == this.#president.user.id, {max: 1, time: 5000}); //REPLACE 5000 with 30000
            const first = collected.first();
            if(first !== undefined) {
                killedPlayer = this.#players.filter(p => p.user.id == getRawUID(first.content))[0];
                if(killedPlayer.user.id == this.#president.user.id) { killedPlayer = null; }
            }

            if(killedPlayer !== null) { break; }

            await channel.send("Invalid player chosen, try again!")
            mentionAttempts++;

            if(mentionAttempts > 2) {
                await channel.send("No valid choice has been made, choosing random player to kill.")
                let tempKilledPlayer = null;
                let randomAttempts = 0
                while((tempKilledPlayer == null || tempKilledPlayer.user.id == this.#president.user.id) && randomAttempts < 10) {
                    tempKilledPlayer = this.#players[randomInt(0, this.playerCount-1)]
                    randomAttempts++;
                }
                killedPlayer = tempKilledPlayer
                break;
            }
        }

        //announce selected player
        await channel.send(getPrintableUserString(this.#president.user.id) + " has decided to kill " + getPrintableUserString(killedPlayer.user.id) + ".")

        //kill selected player and remove them from the player list
        await killedPlayer.user.send("You have been eliminated from the game, however, your party may still win!")
        this.#players.splice(this.#players.findIndex(killedPlayer), 1)
        this.playerCount -= 1;
    }

    endGame() {
        delete this;
    }
}

module.exports = { SecretHitler }