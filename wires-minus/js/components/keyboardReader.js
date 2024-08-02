import { Component } from "shapez/game/component";
import { Entity } from "shapez/game/entity";
import { types } from "shapez/savegame/serialization";

export const DEFAULTKEY = "[?]";

export class KeyboardReaderComponent extends Component {
    static getId() {
        return "KeyboardReader";
    }

    static getSchema() {
        return {
            assignedKey: types.string,
            assignedKeyCode: types.int,
        };
    }

    /**
     * @param {Entity} entity
     * @returns {KeyboardReaderComponent}
     */
    static get(entity) {
        return entity?.components[this.getId()];
    }

    /**
     * Copy the current state to another component
     * @param {KeyboardReaderComponent} otherComponent
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
