import { Component } from "shapez/game/component";

export const enumBasicMathGateVariants = {
    default: "addition",
    subtraction: "subtraction",
    multiplication: "multiplication",
    division: "division",
    modulo: "modulo",
    powerof: "powerof",
    greater: "greater",
    less: "less",
};

export class BasicMathComponent extends Component {
    static getId() {
        return "BasicMath";
    }

    /**
     * @param {string=} type
     */
    constructor(type = enumBasicMathGateVariants.default) {
        super();

        /** @type {string} */
        this.type = type;
    }
}
