import { DrawParameters } from "shapez/core/draw_parameters";
import { getBuildingDataFromCode } from "shapez/game/building_codes";
import { Entity } from "shapez/game/entity";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { MapChunk } from "shapez/game/map_chunk";
import { enumRailVariantToRotation, MetaRailBuilding } from "../buildings/rails";
import { RailComponent } from "../components/railComponent";

export class RailSystem extends GameSystemWithFilter {
    static getId() {
        return "RailSystem";
    }

    constructor(root) {
        super(root, [RailComponent]);

        this.spriteByRotationVariant = [];

        for (let i = 0; i < enumRailVariantToRotation.length; i++) {
            const sprite = MetaRailBuilding.getSpriteByState(i, "buildings");
            this.spriteByRotationVariant[i] = sprite;
        }
    }

    /**
     * @param {DrawParameters} parameters
     * @param {MapChunk} chunk
     */
    drawChunk(parameters, chunk) {
        const contents = chunk.containedEntitiesByLayer["regular"];
        for (const entity of contents) {
            if (!this.validEntity(entity)) {
                continue;
            }

            const staticComp = entity.components.StaticMapEntity;
            const rotationVariant = staticComp.getRotationVariant();
            const sprite = this.spriteByRotationVariant[rotationVariant];
            if (!sprite) {
                continue;
            }

            staticComp.drawSpriteOnBoundsClipped(parameters, sprite, 0);
        }
    }

    /**
     * @param {Entity} entity
     * @returns {Boolean}
     */
    validEntity(entity) {
        return !!entity.components["Rail"];
    }
}
