import { Vector } from "shapez/core/vector";
import { Entity } from "shapez/game/entity";
import { BaseMap } from "shapez/game/map";
import { ModInterface } from "shapez/mods/mod_interface";

/**
 * @param {ModInterface} modInterface
 */
export function overrideMap(modInterface) {
    modInterface.extendClass(BaseMap, ({ $super, $old }) => ({
        /**
         * Returns the tile contents of a given tile
         * @param {number} x
         * @param {number} y
         * @param {Layer} layer
         * @returns {Array<Entity>} Entity or null
         */
        getLayerContentsTileXY(x, y, layer) {
            const chunk = this.getChunkAtTileOrNull(x, y);
            return !chunk ? [] : chunk.getLayerContentsFromTileCoords(x, y, layer);
        },

        /**
         * Returns the tile content of a given tile
         * @param {number} x
         * @param {number} y
         * @param {Layer} layer
         * @returns {Entity} Entity or null
         */
        getLayerContentTileXY(x, y, layer) {
            const chunk = this.getChunkAtTileOrNull(x, y);
            return chunk && chunk.getLayerContentFromWorldCoords(x, y, layer);
        },

        /**
         * Sets the tiles content
         * @param {Vector} tile
         * @param {Entity} entity
         */
        setTileContent(tile, entity) {
            if (shapez.G_IS_DEV) {
                this.internalCheckTile(tile);
            }

            this.getOrCreateChunkAtTile(tile.x, tile.y).setLayerContentFromWorldCords(
                tile.x,
                tile.y,
                entity,
                entity.layer,
                true
            );

            const staticComponent = entity.components.StaticMapEntity;
            assert(staticComponent, "Can only place static map entities in tiles");
        },

        /**
         * Places an entity with the StaticMapEntity component
         * @param {Entity} entity
         */
        placeStaticEntity(entity) {
            assert(entity.components.StaticMapEntity, "Entity is not static");
            const staticComp = entity.components.StaticMapEntity;
            const rect = staticComp.getTileSpaceBounds().getEffectiveRectangle();
            for (let x = rect.left(); x < rect.right(); ++x) {
                for (let y = rect.top(); y < rect.bottom(); ++y) {
                    this.getOrCreateChunkAtTile(x, y).setLayerContentFromWorldCords(
                        x,
                        y,
                        entity,
                        entity.layer,
                        true
                    );
                }
            }
        },

        /**
         * Removes an entity with the StaticMapEntity component
         * @param {Entity} entity
         */
        removeStaticEntity(entity) {
            assert(entity.components.StaticMapEntity, "Entity is not static");
            const staticComp = entity.components.StaticMapEntity;
            const rect = staticComp.getTileSpaceBounds().getEffectiveRectangle();
            for (let x = rect.left(); x < rect.right(); ++x) {
                for (let y = rect.top(); y < rect.bottom(); ++y) {
                    this.getOrCreateChunkAtTile(x, y).setLayerContentFromWorldCords(
                        x,
                        y,
                        entity,
                        entity.layer,
                        false
                    );
                }
            }
        },
    }));
}
