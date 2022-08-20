import { CustomSerializer } from "../customSerializer";

export class WiredPinsSerializer extends CustomSerializer {
    constructor() {
        super("WiredPins", "w");
    }

    serialize(data) {
        const serializedData = [];

        for (let i = 0; i < data.slots.length; i++) {
            const miniSerializedData = [];

            const slot = data.slots[i];
            if (slot.value) {
                miniSerializedData[0] = data.slots[i].value.$;
                miniSerializedData[1] = data.slots[i].value.data;
            }

            serializedData[i] = miniSerializedData;
        }

        return serializedData;
    }

    deserialize(data) {
        // Deserialize and return the data
        return data;
    }
}
