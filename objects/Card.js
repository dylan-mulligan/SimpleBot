class Card {
    #faceup;
    #title;
    #value;
    #content;
    constructor(faceup=false, title="", value="", content="") {
        this.#faceup = faceup;
        this.#title = title;
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
    get title() {
        return this.#title;
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
    set title(val) {
        this.#title = val;
    }

    //methods
    flip() {
        this.#faceup = !this.#faceup;
    }
}

module.exports = { Card }