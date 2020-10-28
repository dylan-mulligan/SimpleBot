class Placard {
    #title;
    #PID;
    #index
    constructor(title=null, PID=null, index=0) {
        this.#title = title;
        this.#PID = PID;
        this.#index = index;
    }

    //getters
    get title() {
        return this.#title;
    }
    get PID() {
        return this.#PID;
    }
    get index() {
        return this.#index;
    }

    //setters
    set title(val) {
        this.#title = val;
    }
    set PID(val) {
        this.#PID = val;
    }
    set index(val) {
        this.#index = val;
    }

    //methods
    moveTo(PID) {
        this.#PID = PID;
    }

    remove() {
        this.#PID = null;
    }

    moveNext(players) {
        this.increment(players.length);
        const prevPID = this.#PID;
        this.#PID = players[this.#index].user.id;
        return [prevPID, this.#PID];
    }

    increment(maxValue) {
        if(this.#index < maxValue - 1) {
            this.#index += 1;
        }
        else {
            this.#index = 0;
        }
    }
}

module.exports = { Placard }