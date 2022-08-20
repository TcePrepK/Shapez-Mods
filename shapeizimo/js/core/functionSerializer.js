import { ExplainedResult } from "shapez/core/explained_result";
import { GameRoot } from "shapez/game/root";
import { SerializerInternal } from "shapez/savegame/serializer_internal";

export class FunctionSerializer {
    /**
     * Serializes the game root into a dump
     * @param {GameRoot} root
     * @returns {import("./utils").SerializedFunctionData}
     */
    generateDumpFromGameRoot(root) {
        const serializer = new SerializerInternal();
        const mode = root.gameMode;

        /** @type {import("./utils").SerializedFunctionData} */
        const data = {
            camera: root.camera.serialize(),
            waypoints: root.hud.parts["waypoints"] ? root.hud.parts["waypoints"].serialize() : null,
            bounds: {
                w: mode["zoneWidth"],
                h: mode["zoneHeight"],
            },
            entities: serializer.serializeEntityArray(root.entityMgr.entities),
            beltPaths: root.systemMgr.systems.belt.serializePaths(),
        };

        return data;
    }

    /**
     * @param {GameRoot} root
     * @param {import("./utils").SerializedFunctionData} func
     */
    deserializeFunction(root, func) {
        const serializer = new SerializerInternal();
        let errorReason = null;

        errorReason = errorReason || root.camera.deserialize(func.camera);
        errorReason = errorReason || serializer.deserializeEntityArray(root, func.entities);
        errorReason = errorReason || root.systemMgr.systems.belt.deserializePaths(func.beltPaths);

        if (root.hud.parts["waypoints"]) {
            errorReason = errorReason || root.hud.parts["waypoints"].deserialize(func.waypoints);
        }

        // Check for errors
        if (errorReason) {
            return ExplainedResult.bad(errorReason);
        }

        return ExplainedResult.good();
    }
}
