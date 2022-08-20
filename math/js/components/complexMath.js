import { Component } from "shapez/game/component";

export const enumComplexMathGateVariants = {
    default: "sin",
    cos: "cos",
    tan: "tan",
    cot: "cot",
    csc: "csc",
    sec: "sec",
    log: "log",
};

export class ComplexMathComponent extends Component {
    static getId() {
        return "ComplexMath";
    }

    /**
     * @param {string=} type
     */
    constructor(type = enumComplexMathGateVariants.default) {
        super();

        /** @type {string} */
        this.type = type;
    }
}
