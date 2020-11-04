const { TrackSpace } = require("./TrackSpace");
const { createArray } = require("../utils")

class Track {
    #party;
    #spaces;
    #id;
    #filled = 0;
    constructor(party="", id=null, spaces=null) {
        this.#party = party;
        if(id !== null) {
            this.#id = id;
        }
        if(spaces !== null) {
            this.#spaces = spaces;
        }
        else {
            if(this.#party == "liberal") {
                this.#spaces = createArray(6, new TrackSpace());
            }
            else {
                this.#spaces = this.makeFascistSpaces();
            }
        }
    }

    //getters
    get party() {
        return this.#party;
    }
    get spaces() {
        return this.#spaces;
    }
    get id() {
        return this.#id;
    }
    get filled() {
        return this.#filled;
    }

    //setters
    set party(val) {
        this.#party = val;
    }
    set spaces(val) {
        this.#spaces = val;
    }
    set id(val) {
        this.#id = val;
    }
    set filled(val) {
        this.#filled = val;
    }

    //methods
    fillNextSpace(card) {
        this.#spaces.forEach(space => {
            if(!space.filled) {
                const power = space.fill(card);
                this.#filled += 1
                if(power !== "") {
                    return power;
                }
            }
        });
        return null;
    }

    makeFascistSpaces() {
        let spaces = [];
        switch (this.#id) {
            case "1":
                spaces = 
                [
                new TrackSpace("inspectPlayer"), 
                new TrackSpace("inspectPlayer"),
                new TrackSpace("specialElection"), 
                new TrackSpace("killPlayer"), 
                new TrackSpace("killPlayer"), 
                new TrackSpace()
                ];
                break;
            case "2":
                spaces = 
                [
                new TrackSpace(), 
                new TrackSpace("inspectPlayer"),
                new TrackSpace("specialElection"), 
                new TrackSpace("killPlayer"), 
                new TrackSpace("killPlayer"), 
                new TrackSpace()
                ];
                break;
            case "3":
                spaces = 
                [
                new TrackSpace(), 
                new TrackSpace(),
                new TrackSpace("inspectCards"), 
                new TrackSpace("killPlayer"), 
                new TrackSpace("killPlayer"), 
                new TrackSpace()
                ];
                break;
            default:
                break;
        }
        return spaces;
    }
}

module.exports = { Track }