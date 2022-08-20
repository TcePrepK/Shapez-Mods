import { Component } from "shapez/game/component";
import { types } from "shapez/savegame/serialization";

export const DEFAULTKEY = "[?]";

export class KeyboardInputComponent extends Component {
    static getId() {
        return "KeyboardInput";
    }

    static getSchema() {
        return {
            assignedKey: types.string,
            assignedKeyCode: types.int,
        };
    }

    /**
     * Copy the current state to another component
     * @param {KeyboardInputComponent} otherComponent
     */
    copyAdditionalStateTo(otherComponent) {
        otherComponent.assignKey(this.assignedKey, this.assignedKeyCode);
    }

    constructor() {
        super();

        /** @type {String} */
        this.assignedKey = DEFAULTKEY;

        /** @type {Number} */
        this.assignedKeyCode = 0;

        /** @type {Boolean} */
        this.pressing = false;
    }

    /**
     * @param {string} key
     */
    assignKey(key, keyCode) {
        this.assignedKey = key;
        this.assignedKeyCode = keyCode;
    }
}
