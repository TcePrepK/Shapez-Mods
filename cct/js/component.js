import { Component } from "shapez/game/component";
import { types } from "shapez/savegame/serialization";

export class CCTComponent extends Component {
    static getId() {
        return "CommandController";
    }

    static getSchema() {
        return {
            command: types.string,
        };
    }

    /**
     * Copy the current state to another component
     * @param {CCTComponent} otherComponent
     */
    copyAdditionalStateTo(otherComponent) {
        otherComponent.command = this.command;
    }

    /**
     * @param {string} command
     */
    constructor(command = "") {
        super();
        this.command = command;
        this.error = { msg: "", lifeSpan: 0 };
    }
}
