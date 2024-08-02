import { globalConfig } from "shapez/core/config";
import { DrawParameters } from "shapez/core/draw_parameters";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { MapChunk } from "shapez/game/map_chunk";
import { GameRoot } from "shapez/game/root";
import { FiberPinsComponent } from "../components/fiberPins";
import { FiberEditor } from "../core/fiberEditor";

export class FiberPinsSystem extends GameSystemWithFilter {
    static getId() {
        return "fiberPins";
    }

    /**
     * @param {GameRoot} root
     * @returns {FiberPinsSystem}
     */
    static get(root) {
        return root.systemMgr.systems[this.getId()];
    }

    constructor(root) {
        super(root, [FiberPinsComponent]);
    }

    /**
     * @param {DrawParameters} parameters
     * @param {MapChunk} chunk
     * @returns
     */
    drawChunk(parameters, chunk) {
        const ctx = parameters.context;

        const entities = chunk.containedEntities;
        for (const entity of entities) {
            const fiberPin = FiberPinsComponent.get(entity);
            if (!fiberPin) {
                continue;
            }

            const staticComp = entity.components.StaticMapEntity;
            for (const slot of fiberPin.slots) {
                if (!slot.linkedNetwork) {
                    continue;
                }

                const color = slot.linkedNetwork.color;
                const pos = FiberEditor.positionOfSlot(staticComp, slot);

                ctx.fillStyle = color;
                ctx.globalAlpha = 1;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, globalConfig.tileSize / 10, 0, 2 * Math.PI);
                ctx.closePath();
                ctx.fill();
            }
        }
    }
}
