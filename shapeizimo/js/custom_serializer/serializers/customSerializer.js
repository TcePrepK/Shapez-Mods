import { createLogger } from "shapez/core/logging";

export class CustomSerializer {
    /**
     * @param {String} input
     * @param {String} output
     */
    constructor(input, output) {
        this.input = input;
        this.output = output;

        this.logger = createLogger("customSerializer/" + input + "-" + output);
    }

    /**
     * @returns {boolean}
     */
    validate(data) {
        return false;
    }

    serialize(data) {
        this.logger.error("Serialization not implemented");
        return data;
    }

    deserialize(data) {
        this.logger.error("Deserialization not implemented");
        return data;
    }

    /**
     * @returns {String}
     */
    getInput() {
        return this.input;
    }

    /**
     * @returns {String}
     */
    getOutput() {
        return this.output;
    }
}
