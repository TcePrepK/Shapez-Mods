import { NumberItem } from "./item";

export class NumberManager {
    constructor() {
        /** @type {Map<number, NumberItem>} */
        this.numberToItem = new Map();
    }

    /**
     * @param {number} number
     * @returns {NumberItem}
     */
    getItem(number) {
        if (!this.checkNumber(number)) {
            return null;
        }

        if (this.numberToItem.has(number)) {
            return this.numberToItem.get(number);
        }

        const item = new NumberItem(number);
        this.numberToItem.set(number, item);
        return item;
    }

    /**
     * @param {number} number
     * @returns {boolean}
     */
    checkNumber(number) {
        return !(isNaN(number) || number === Number.POSITIVE_INFINITY || number === Number.NEGATIVE_INFINITY);
    }
}
