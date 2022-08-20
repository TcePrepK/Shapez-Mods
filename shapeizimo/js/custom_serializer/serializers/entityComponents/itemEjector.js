import { CustomSerializer } from "../customSerializer";

export class ItemEjectorSerializer extends CustomSerializer {
    constructor() {
        super("ItemEjector", "ie");
    }

    serialize(data) {
        const serializedData = [];

        for (let i = 0; i < data.slots.length; i++) {
            const miniSerializedData = [];

            miniSerializedData[0] = data.slots[i].item;
            miniSerializedData[1] = data.slots[i].progress;

            serializedData[i] = miniSerializedData;
        }

        return serializedData;
    }

    deserialize(data) {
        // Deserialize and return the data
        return data;
    }
}
