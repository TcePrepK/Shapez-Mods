import { StaticMapEntityComponent } from "shapez/game/components/static_map_entity";
import { ModInterface } from "shapez/mods/mod_interface";
import { types } from "shapez/savegame/serialization";

/**
 * @param {ModInterface} modInterface
 */
export function overrideStaticMapEntity(modInterface) {
    StaticMapEntityComponent.getSchema = function () {
        console.log(this.tileSize);
        return {
            origin: types.tileVector,
            rotation: types.float,
            originalRotation: types.float,

            // See building_codes.js
            code: types.uintOrString,
        };
    };
}
