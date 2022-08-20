import { customSerializerRegistry } from "../serializer_registry";
import { CustomSerializer } from "./customSerializer";

export class EntitySerializer extends CustomSerializer {
    constructor() {
        super("entity", null);
    }

    validate(data) {
        if (!data.uid) {
            return false;
        }

        if (!data.components) {
            return false;
        }

        if (!data.components.StaticMapEntity) {
            return false;
        }

        return true;
    }

    serialize(data) {
        const serializedData = [];

        serializedData[0] = {};

        for (const inputName in data.components) {
            const serializer = customSerializerRegistry.getClassByInput(inputName);
            if (!serializer) {
                // console.log(
                //     `Serializer not found for ${inputName}, data: ${JSON.stringify(
                //         data.components[inputName]
                //     )}`
                // );
                continue;
            }

            const component = data.components[inputName];
            serializedData[0][serializer.getOutput()] = serializer.serialize(component);

            // console.log(
            //     `Serialized successfully ${inputName}, data: ${JSON.stringify(
            //         serializedData[0][serializer.getOutput()]
            //     )}`
            // );
        }

        return serializedData;
    }

    deserialize(data) {
        // Deserialize and return the data
        return data;
    }
}
