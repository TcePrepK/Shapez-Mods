import { Component } from "shapez/game/component";
import { types } from "shapez/savegame/serialization";

export const DEFAULTCODE = " ";

export class WirelessCodeComponent extends Component {
    static getId() {
        return "WirelessCode";
    }

    static getSchema() {
        return {
            wirelessCode: types.string,
        };
    }

    /**
     * Copy the current state to another component
     * @param {WirelessCodeComponent} otherComponent
     */
    copyAdditionalStateTo(otherComponent) {
        otherComponent.wirelessCode = this.wirelessCode;
    }

    /**
     *
     * @param {string} wirelessCode
     */
    constructor(wirelessCode = DEFAULTCODE) {
        super();
        this.wirelessCode = wirelessCode;
    }
}
