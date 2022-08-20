import { CustomSerializer } from "./customSerializer";

export class BasicSerializer extends CustomSerializer {
    constructor() {
        super("basic", "basic");
    }

    validate(data) {
        // Validate the input data
        return true;
    }

    serialize(data) {
        // Serialize and return the data
        return data;
    }

    deserialize(data) {
        // Deserialize and return the data
        return data;
    }
}
