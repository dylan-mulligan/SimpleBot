class Player {
    #user;
    #role;
    #party;
    #hand;
    #alive;
    #roll;
    #placard;
    #notHitler;

    constructor(user=null) {
        this.#user = user;
        this.#role = "";
        this.#party = "";
        this.#hand = [];
        this.#alive = true;
        this.#roll = 0;
        this.#placard = null;
        this.#notHitler = false;
    }

    //getters
    get user() {
        return this.#user;
    }
    get role() {
        return this.#role;
    }
    get party() {
        return this.#party;
    }
    get hand() {
        return this.#hand;
    }
    get alive() {
        return this.#alive;
    }
    get roll() {
        return this.#roll;
    }
    get placard() {
        return this.#placard;
    }
    get notHitler() {
        return this.#notHitler;
    }

    //setters
    set user(val) {
        this.#user = val;
    }
    set role(val) {
        this.#role = val;
    }
    set party(val) {
        this.#party = val;
    }
    set hand(val) {
        this.#hand = val;
    }
    set alive(val) {
        this.#alive = val;
    }
    set roll(val) {
        this.#roll = val;
    }
    set placard(val) {
        this.#placard = val;
    }
    set notHitler(val) {
        this.#notHitler = val;
    }

    //methods
    kill() {
        this.#alive = false;
    }

    deal(card) {
        this.#hand.push(card);
    }

    assignRole(role) {
        this.#role = role;
        if(role == "liberal") { this.#party = "liberal"; }
        else { this.#party = "fascist"; }
    }

    givePlacard(placard) {
        this.#placard = placard;
    }

    removePlacard() {
        this.#placard = null;
    }
}

module.exports = { Player }