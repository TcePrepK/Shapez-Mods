import { Component } from "shapez/game/component";
import { types } from "shapez/savegame/serialization";

export class RandomNumberGeneratorComponent extends Component {
    static getId() {
        return "RandomNumberGenerator";
    }

    static getSchema() {
        return {
            number: types.float,
            pulse: types.bool,
        };
    }

    constructor() {
        super();

        this.number = null;
        this.pulse = false;
    }
}
