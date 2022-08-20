import { globalConfig } from "shapez/core/config";
import { DrawParameters } from "shapez/core/draw_parameters";
import { Loader } from "shapez/core/loader";
import { enumColors } from "shapez/game/colors";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { BooleanItem } from "shapez/game/items/boolean_item";
import { COLOR_ITEM_SINGLETONS } from "shapez/game/items/color_item";
import { ShapeItem } from "shapez/game/items/shape_item";
import { MapChunk } from "shapez/game/map_chunk";
import { QuadSenderComponent } from "../components/quad_sender";

export class QuadSenderSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [QuadSenderComponent]);

        this.pinSprite = Loader.getSprite("sprites/buildings/quad_sender-wire.png");
    }

    update() {
        for (const entity of this.allEntities) {
            /** @type {QuadSenderComponent} */
            const quadComp = entity.components["QuadSender"];

            quadComp.values = [null, null, null, null];

            const staticComp = entity.components.StaticMapEntity;
            const rotation = 4 - staticComp.rotation / 90;
            const readOrder = [0, 1, 3, 2];

            const pins = entity.components.WiredPins.slots;
            for (let i = 0; i < 4; ++i) {
                const index = readOrder[i];
                const pin = pins[(index + rotation) % 4];
                const network = pin.linkedNetwork;
                if (!network) {
                    continue;
                }

                const pinValue = network.currentValue;
                if (!pinValue || network.valueConflict) {
                    continue;
                }

                if (pinValue instanceof BooleanItem) {
                    quadComp.values[i] = pinValue.value ? [enumColors.white] : [enumColors.uncolored];
                    continue;
                } else if (pinValue instanceof ShapeItem) {
                    /** @type {Array<Array<enumColors>>} */
                    const subLayers = [];
                    for (const layer of pinValue.definition.layers) {
                        /** @type {Array<enumColors>} */
                        const subValues = [];

                        const readOrder = [3, 0, 2, 1];
                        for (let j = 0; j < 4; ++j) {
                            const corner = layer[readOrder[j]];
                            if (!corner) {
                                subValues.push(null);
                                continue;
                            }

                            subValues.push(COLOR_ITEM_SINGLETONS[corner.color]);
                        }

                        subLayers.push(subValues);
                    }

                    while (subLayers.length != 1 && subLayers.length != 4) {
                        subLayers.push(null);
                    }

                    // @ts-ignore
                    quadComp.values[i] = subLayers;
                    continue;
                }

                quadComp.values[i] = pinValue;
            }
        }
    }

    /**
     * @param {DrawParameters} parameter
     * @param {MapChunk} chunk
     */
    drawChunk(parameter, chunk) {
        if (this.root.currentLayer !== "wires") {
            return;
        }

        const contents = chunk.containedEntitiesByLayer["regular"];
        for (let i = 0; i < contents.length; ++i) {
            const entity = contents[i];

            /** @type {QuadSenderComponent} */
            const quadComp = entity.components["QuadSender"];
            if (!quadComp) {
                continue;
            }

            const staticComp = entity.components.StaticMapEntity;
            const size = globalConfig.tileSize;
            const origin = staticComp.origin.addScalar(0.5).multiplyScalar(size);

            this.pinSprite.drawCachedCentered(parameter, origin.x, origin.y, size);
        }
    }
}
