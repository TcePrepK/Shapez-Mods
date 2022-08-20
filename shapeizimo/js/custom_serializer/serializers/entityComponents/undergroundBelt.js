import { CustomSerializer } from "../customSerializer";

export class UndergroundBeltSerializer extends CustomSerializer {
    constructor() {
        super("UndergroundBelt", "ub");
    }

    serialize(data) {
        const serializedData = data.pendingItems;

        return serializedData;
    }

    deserialize(data) {
        // Deserialize and return the data
        return data;
    }
}
