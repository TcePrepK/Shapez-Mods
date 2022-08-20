import { CustomSerializer } from "./customSerializer";

export class BletPathsSerializer extends CustomSerializer {
    constructor() {
        super("beltPaths", "bp");
    }

    serialize(data) {
        const serializedData = [];

        for (let i = 0; i < data.length; i++) {
            const miniSerializedData = [];

            const path = data[i];

            miniSerializedData[0] = path.entityPath.map(uid => uid - 10000);
            miniSerializedData[1] = path.items;
            miniSerializedData[2] = path.spacingToFirstItem;

            serializedData[i] = miniSerializedData;
        }

        return serializedData;
    }

    deserialize(data) {
        // Deserialize and return the data
        return data;
    }
}
