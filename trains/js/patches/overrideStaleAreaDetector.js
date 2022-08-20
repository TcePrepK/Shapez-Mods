import { Rectangle } from "shapez/core/rectangle";
import { StaleAreaDetector } from "shapez/core/stale_area_detector";
import { Component } from "shapez/game/component";
import { Entity } from "shapez/game/entity";
import { ModInterface } from "shapez/mods/mod_interface";

/**
 * @param {ModInterface} modInterface
 */
export function overrideStaleAreaDetector(modInterface) {
    modInterface.extendClass(StaleAreaDetector, ({ $super, $old }) => ({
        /**
         * Makes this detector recompute the area of an entity whenever
         * it changes in any way
         * @param {Array<typeof Component>} components
         * @param {number} tilesAround How many tiles arround to expand the area
         */
        recomputeOnComponentsChanged(components, tilesAround) {
            const componentIds = components.map(component => component.getId());

            /**
             * Internal checker method
             * @param {Entity} entity
             */
            const checker = entity => {
                if (!this.root.gameInitialized) {
                    return;
                }

                // Check for all components
                for (let i = 0; i < componentIds.length; ++i) {
                    if (entity.components[componentIds[i]]) {
                        // Entity is relevant, compute affected area
                        const rotatedArea = entity.components.StaticMapEntity.getTileSpaceBounds();

                        /** @ts-ignore @type {Rectangle} */
                        const effectiveArea = rotatedArea.getEffectiveRectangle();

                        this.invalidate(effectiveArea.expandedInAllDirections(tilesAround));
                        return;
                    }
                }
            };

            this.root.signals.entityAdded.add(checker);
            this.root.signals.entityChanged.add(checker);
            this.root.signals.entityComponentRemoved.add(checker);
            this.root.signals.entityGotNewComponent.add(checker);
            this.root.signals.entityDestroyed.add(checker);
        },
    }));
}
