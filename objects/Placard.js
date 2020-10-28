class Placard {
    #title;
    #PID;
    constructor(title=null, PID=null) {
        this.#title = title;
        this.#PID = PID;
    }

    //getters
    get title() {
        return this.#title;
    }
    get PID() {
        return this.#PID;
    }

    //setters
    set title(val) {
        this.#title = val;
    }
    set PID(val) {
        this.#PID = val;
    }

    //methods
    moveTo(PID) {
        this.#PID = PID;
    }

    remove() {
        this.#PID = null;
    }
}

module.exports = { Placard }