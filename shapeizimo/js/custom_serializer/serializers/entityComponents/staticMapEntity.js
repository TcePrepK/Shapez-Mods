import { CustomSerializer } from "../customSerializer";

export class StaticMapEntitySerializer extends CustomSerializer {
    constructor() {
        super("StaticMapEntity", "sme");
    }

    validate(data) {
        if (!(data.code && data.origin && data.originalRotation && data.rotation)) {
            return false;
        }

        return true;
    }

    serialize(data) {
        const serializedData = [];

        serializedData[0] = [data.origin.x, data.origin.y];
        serializedData[1] = (data.originalRotation << 2) + data.rotation;
        serializedData[2] = data.code;

        return serializedData;
    }

    deserialize(data) {
        // Deserialize and return the data
        return data;
    }
}
