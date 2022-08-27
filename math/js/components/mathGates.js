import { Component } from "shapez/game/component";

export const basicMathVariants = {
    default: "addition",
    subtraction: "subtraction",
    multiplication: "multiplication",
    division: "division",
    modulo: "modulo",
    powerof: "powerof",
};

export const complexMathVariants = {
    default: "log",
    sqrt: "sqrt",
    floor: "floor",
    ceil: "ceil",
    round: "round",
    sign: "sign",
    abs: "abs",
};

export const trigMathVairants = {
    default: "sin",
    cos: "cos",
    tan: "tan",
    cot: "cot",
    csc: "csc",
    sec: "sec",
};

export const arctrigMathVariants = {
    default: "arcsin",
    arccos: "arccos",
    arctan: "arctan",
    arccot: "arccot",
    arccsc: "arccsc",
    arcsec: "arcsec",
};

export const compareMathVariants = {
    default: "greaterThan",
    lessThan: "lessThan",
};

export const bitMathVariants = {
    default: "and",
    or: "or",
    xor: "xor",
    not: "not",
    lshift: "lshift",
    rshift: "rshift",
    urshift: "urshift",
};

export class MathGatesComponent extends Component {
    static getId() {
        return "MathGates";
    }

    /**
     * @param {string} type
     */
    constructor(type) {
        super();

        /** @type {string} */
        this.type = type;
    }
}
