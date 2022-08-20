import { CustomSerializer } from "./customSerializer";

export class FunctionBoundsSerializer extends CustomSerializer {
    constructor() {
        super("bounds", "fb");
    }

    serialize(data) {
        const serializedData = [];

        serializedData[0] = data.w;
        serializedData[1] = data.h;

        return serializedData;
    }

    deserialize(data) {
        // Deserialize and return the data
        return data;
    }
}
