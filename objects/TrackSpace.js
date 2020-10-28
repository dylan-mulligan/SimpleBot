class TrackSpace {
    #filled;
    #card;
    #power;
    constructor(power="", filled=false, card=null) {
        this.#filled = filled;
        this.#power = power;
        this.#card = card;
    }

    //getters
    get filled() {
        return this.#filled;
    }
    get power() {
        return this.#power;
    }
    get card() {
        return this.#card;
    }

    //setters
    set filled(val) {
        this.#filled = val;
    }
    set power(val) {
        this.#power = val;
    }
    set card(val) {
        this.#card = val;
    }

    //methods
    fill(card) {
        this.#filled = true;
        this.#card = card;
        return this.#power;
    }
}

module.exports = { TrackSpace }