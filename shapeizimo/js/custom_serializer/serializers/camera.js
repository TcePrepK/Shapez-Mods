import { CustomSerializer } from "./customSerializer";

export class CameraSerializer extends CustomSerializer {
    constructor() {
        super("camera", "c");
    }

    serialize(data) {
        const serializedData = [];

        serializedData[0] = data.zoomLevel;
        serializedData[1] = [data.center.x, data.center.y];

        return serializedData;
    }

    deserialize(data) {
        // Deserialize and return the data
        return data;
    }
}
