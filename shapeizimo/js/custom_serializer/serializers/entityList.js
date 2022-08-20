import { Entity } from "shapez/game/entity";
import { customSerializerRegistry } from "../serializer_registry";
import { CustomSerializer } from "./customSerializer";

export class EntityListSerializer extends CustomSerializer {
    constructor() {
        super("entities", "e");
    }

    validate(data) {
        if (!(data instanceof Array)) {
            return false;
        }

        if (data.find(e => !customSerializerRegistry.getClassByInput("entity").validate(e))) {
            return false;
        }

        return true;
    }

    serialize(data) {
        if (!this.validate(data)) {
            this.logger.error("Invalid data for serialization");
            return null;
        }

        const serializedData = [];

        const entitySerializer = customSerializerRegistry.getClassByInput("entity");
        for (const entity of data) {
            serializedData.push(entitySerializer.serialize(entity));
        }

        return serializedData;
    }

    deserialize(data) {
        console.log(data);
    }
}
