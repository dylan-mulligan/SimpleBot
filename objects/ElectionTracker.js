class ElectionTracker {
    #count;
    constructor(count=0) {
        this.#count = count;
    }

    //getters
    get count() {
        return this.#count;
    }

    //setters
    set count(val) {
        this.#count = val;
    }

    //methods
    increase() {
        this.#count += 1;
    }

    reset() {
        this.#count = 0;
    }
}

module.exports = { ElectionTracker }