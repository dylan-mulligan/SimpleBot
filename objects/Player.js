class Player {
    #username;
    #id;
    #role;
    #party;
    #hand;
    #alive;
    constructor(username="", id="", role="", party="", hand=[], alive=true) {
        this.#username = username;
        this.#id = id;
        this.#role = role;
        this.#party = party;
        this.#hand = hand;
        this.#alive = alive;
    }

    //getters
    get username() {
        return this.#username;
    }
    get id() {
        return this.#id;
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

    //setters
    set username(val) {
        this.#username = val;
    }
    set id(val) {
        this.#id = val;
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

    //methods
    kill() {
        this.#alive = false;
    }

    deal(card) {
        this.#hand.push(card);
    }
}

module.exports = { Player }