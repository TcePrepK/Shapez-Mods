import { CustomSerializer } from "../customSerializer";

export class ItemProcessorSerializer extends CustomSerializer {
    constructor() {
        super("ItemProcessor", "ip");
    }

    serialize(data) {
        const serializedData = data.nextOutputSlot;

        return serializedData;
    }

    deserialize(data) {
        // Deserialize and return the data
        return data;
    }
}
