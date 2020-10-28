class Card {
    #faceup;
    #value;
    #content;
    constructor(faceup=false, value="", content="") {
        this.#faceup = faceup;
        this.#value = value;
        this.#content = content;
    }

    //getters
    get faceup() {
        return this.#faceup;
    }
    get value() {
        return this.#value;
    }
    get content() {
        return this.#content;
    }

    //setters
    set faceup(val) {
        this.#faceup = val;
    }
    set value(val) {
        this.#value = val;
    }
    set content(val) {
        this.#content = val;
    }

    //methods
    flip() {
        this.#faceup = !this.#faceup;
    }
}

module.exports = { Card }