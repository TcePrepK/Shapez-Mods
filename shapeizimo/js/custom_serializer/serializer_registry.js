import { createLogger } from "shapez/core/logging";
import { CustomSerializer } from "./serializers/customSerializer";

const logger = createLogger("customSerializer/registry");

export class CustomSerializerRegistry {
    constructor() {
        /** @type {Map<string, CustomSerializer>} */
        this.inputToClass = new Map();

        /** @type {Map<string, CustomSerializer>} */
        this.outputToClass = new Map();
    }

    /**
     * @param {typeof CustomSerializer} serializerClass
     */
    register(serializerClass) {
        // @ts-ignore
        const serializer = new serializerClass();

        this.inputToClass.set(serializer.getInput(), serializer);
        this.outputToClass.set(serializer.getOutput(), serializer);
    }

    /**
     * @param {string} input
     * @returns {CustomSerializer}
     */
    getClassByInput(input) {
        const serializer = this.inputToClass.get(input);
        if (!serializer) {
            logger.warn("No serializer found for input: " + input);
            // return this.inputToClass.get("basic");
        }

        return serializer;
    }

    /**
     * @param {string} output
     * @returns {CustomSerializer}
     */
    getClassByOutput(output) {
        const serializer = this.outputToClass.get(output);
        if (!serializer) {
            logger.warn("No serializer found for output: " + output);
            // return this.outputToClass.get("basic");
        }

        return serializer;
    }
}

export const customSerializerRegistry = new CustomSerializerRegistry();
