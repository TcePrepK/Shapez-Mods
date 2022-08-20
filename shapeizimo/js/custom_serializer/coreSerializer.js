import { BasicSerializer } from "./serializers/basicSerializer";
import { CameraSerializer } from "./serializers/camera";
import { CustomSerializer } from "./serializers/customSerializer";
import { EntityListSerializer } from "./serializers/entityList";
import { EntitySerializer } from "./serializers/entity";
import { FunctionBoundsSerializer } from "./serializers/functionBounds";
import { WaypointSerializer } from "./serializers/waypoints";
import { customSerializerRegistry } from "./serializer_registry";
import { LeverSerializer } from "./serializers/entityComponents/lever";
import { StaticMapEntitySerializer } from "./serializers/entityComponents/staticMapEntity";
import { WiredPinsSerializer } from "./serializers/entityComponents/wiredPins";
import { ItemProcessorSerializer } from "./serializers/entityComponents/itemProcessor";
import { ItemEjectorSerializer } from "./serializers/entityComponents/itemEjector";
import { UndergroundBeltSerializer } from "./serializers/entityComponents/undergroundBelt";
import { MinerSerializer } from "./serializers/entityComponents/miner";
import { BletPathsSerializer } from "./serializers/beltPaths";

/**
 * @param {typeof CustomSerializer} serializer
 */
function register(serializer) {
    customSerializerRegistry.register(serializer);
}

function registerAllSerializers() {
    register(BasicSerializer);

    register(CameraSerializer);
    register(WaypointSerializer);
    register(FunctionBoundsSerializer);
    register(EntityListSerializer);
    register(BletPathsSerializer);

    register(EntitySerializer);
    register(StaticMapEntitySerializer);
    register(ItemProcessorSerializer);
    register(ItemEjectorSerializer);
    register(UndergroundBeltSerializer);
    register(MinerSerializer);
    register(WiredPinsSerializer);
    register(LeverSerializer);
}

registerAllSerializers();

export class CoreCustomSerializer {
    /**
     * @param {Object} data
     */
    serializeData(data) {
        if (!(data instanceof Object)) {
            return data;
        }

        const serializedCoreData = {};

        for (const inputName in data) {
            const serializer = customSerializerRegistry.getClassByInput(inputName);
            if (!serializer) {
                // console.log(
                //     `Serializer not found for ${inputName}, data: ${JSON.stringify(data[inputName])}`
                // );
                continue;
            }

            const serializedData = serializer.serialize(data[inputName]);
            serializedCoreData[serializer.getOutput()] = serializedData;

            // console.log(`Serialized successfully ${inputName}, data: ${JSON.stringify(serializedData)}`);
        }

        return serializedCoreData;
    }
}
