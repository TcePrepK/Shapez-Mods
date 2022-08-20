import { CustomSerializer } from "../customSerializer";

export class MinerSerializer extends CustomSerializer {
    constructor() {
        super("Miner", "m");
    }

    serialize(data) {
        const serializedData = [];

        serializedData[0] = data.lastMiningTime;
        serializedData[1] = data.itemChainBuffer;

        return serializedData;
    }

    deserialize(data) {
        // Deserialize and return the data
        return data;
    }
}
