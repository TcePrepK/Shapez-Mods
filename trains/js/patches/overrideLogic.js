import { globalConfig } from "shapez/core/config";
import { STOP_PROPAGATION } from "shapez/core/signal";
import { Vector } from "shapez/core/vector";
import { Entity } from "shapez/game/entity";
import { GameLogic } from "shapez/game/logic";
import { ModInterface } from "shapez/mods/mod_interface";
import { RotatableRectangle } from "../tools/rotatableRectangle";

/**
 * @param {ModInterface} modInterface
 */
export function overrideLogic(modInterface) {
    modInterface.extendClass(GameLogic, ({ $super, $old }) => ({
        /**
         * Checks if the given entity can be placed
         * @param {Entity} entity
         * @param {Object} param0
         * @param {boolean=} param0.allowReplaceBuildings
         * @param {Vector=} param0.offset Optional, move the entity by the given offset first
         * @returns {[boolean, Array<Entity>]} true if the entity could be placed there
         */
        checkCanPlaceEntity(entity, { allowReplaceBuildings = true, offset = null }) {
            /** @ts-ignore @type {RotatableRectangle} */
            const rotatedRect = entity.components.StaticMapEntity.getTileSpaceBounds();
            if (offset) {
                rotatedRect.moveByVector(offset);
            }

            const rect = rotatedRect.getEffectiveRectangle();

            // Check the whole area of the building
            let hitEntities = [];
            for (let x = rect.left(); x < rect.right(); ++x) {
                for (let y = rect.top(); y < rect.bottom(); ++y) {
                    /** @type {Array<Entity>} */
                    const otherEntities = this.root.map.getLayerContentsTileXY(x, y, entity.layer);
                    if (otherEntities.length == 0) {
                        continue;
                    }

                    hitEntities.push(...otherEntities);
                }
            }

            for (const hitEntity of hitEntities) {
                const staticComp = hitEntity.components.StaticMapEntity;

                /** @ts-ignore @type {RotatableRectangle} */
                const otherRotatedRect = staticComp.getTileSpaceBounds();
                if (!otherRotatedRect.intersects(rotatedRect)) {
                    continue;
                }

                if (
                    !allowReplaceBuildings ||
                    !staticComp
                        .getMetaBuilding()
                        .getIsReplaceable(staticComp.getVariant(), staticComp.getRotationVariant())
                ) {
                    // This one is a direct blocker
                    return [false, hitEntities];
                }
            }

            if (this.root.signals.prePlacementCheck.dispatch(entity, offset) === STOP_PROPAGATION) {
                return [false, hitEntities];
            }

            return [true, hitEntities];
        },

        /**
         * Removes all entities with a RemovableMapEntityComponent which need to get
         * removed before placing this entity
         * @param {Entity} entity
         */
        freeEntityAreaBeforeBuild(entity) {
            const rotatedRect = entity.components.StaticMapEntity.getTileSpaceBounds();
            const rect = rotatedRect.getEffectiveRectangle();
            // Remove any removeable colliding entities on the same layer
            for (let x = rect.left(); x < rect.right(); ++x) {
                for (let y = rect.top(); y < rect.bottom(); ++y) {
                    const otherEntity = this.root.map.getLayerContentXY(x, y, entity.layer);
                    if (!otherEntity) {
                        continue;
                    }

                    const staticComp = otherEntity.components.StaticMapEntity;
                    const otherRotatedRect = staticComp.getTileSpaceBounds();
                    if (!otherRotatedRect.intersects(rotatedRect)) {
                        continue;
                    }

                    assertAlways(
                        staticComp
                            .getMetaBuilding()
                            .getIsReplaceable(staticComp.getVariant(), staticComp.getRotationVariant()),
                        "Tried to replace non-repleaceable entity"
                    );
                    if (!this.tryDeleteBuilding(otherEntity)) {
                        assertAlways(false, "Tried to replace non-repleaceable entity #2");
                    }
                }
            }

            // Perform other callbacks
            this.root.signals.freeEntityAreaBeforeBuild.dispatch(entity);
        },
    }));
}
