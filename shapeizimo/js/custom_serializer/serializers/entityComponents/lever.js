import { CustomSerializer } from "../customSerializer";

export class LeverSerializer extends CustomSerializer {
    constructor() {
        super("Lever", "l");
    }

    serialize(data) {
        const serializedData = data.toggled ? 1 : 0;

        return serializedData;
    }

    deserialize(data) {
        // Deserialize and return the data
        return data;
    }
}
