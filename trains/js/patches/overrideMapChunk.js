import { globalConfig } from "shapez/core/config";
import { fastArrayDeleteValueIfContained } from "shapez/core/utils";
import { BaseItem } from "shapez/game/base_item";
import { Entity } from "shapez/game/entity";
import { MapChunk } from "shapez/game/map_chunk";
import { ModInterface } from "shapez/mods/mod_interface";
import { RotatableRectangle } from "../tools/rotatableRectangle";

/**
 * @param {ModInterface} modInterface
 */
export function overrideMapChunk(modInterface) {
    modInterface.extendClass(MapChunk, ({ $super, $old }) => ({
        /**
         * @param {number} worldX
         * @param {number} worldY
         * @returns {BaseItem=}
         */
        getLowerLayerFromWorldCoords(worldX, worldY) {
            const localX = Math.floor(worldX - this.tileX);
            const localY = Math.floor(worldY - this.tileY);
            assert(localX >= 0, "Local X is < 0");
            assert(localY >= 0, "Local Y is < 0");
            assert(localX < globalConfig.mapChunkSize, "Local X is >= chunk size");
            assert(localY < globalConfig.mapChunkSize, "Local Y is >= chunk size");
            return this.lowerLayer[localX][localY] || null;
        },

        /**
         * Returns the contents of this chunk from the given world space coordinates
         * @param {number} worldX
         * @param {number} worldY
         * @returns {Entity=}
         */
        getTileContentFromWorldCoords(worldX, worldY) {
            return this.getLayerContentFromWorldCoords(worldX, worldY, "regular");
        },

        /**
         * Returns the contents of this chunk from the given world space coordinates
         * @param {number} worldX
         * @param {number} worldY
         * @returns {Array<Entity>}
         */
        getLayersContentsMultipleFromWorldCoords(worldX, worldY) {
            const localX = Math.floor(worldX - this.tileX);
            const localY = Math.floor(worldY - this.tileY);
            assert(localX >= 0, "Local X is < 0");
            assert(localY >= 0, "Local Y is < 0");
            assert(localX < globalConfig.mapChunkSize, "Local X is >= chunk size");
            assert(localY < globalConfig.mapChunkSize, "Local Y is >= chunk size");

            const regularContent = this.contents[localX][localY];
            const wireContent = this.wireContents[localX][localY];
            const contents = [...(regularContent || []), ...(wireContent || [])];

            const result = [];
            for (let i = 0; i < contents.length; i++) {
                /** @type {Entity} */
                const content = contents[i];

                const rect = content.components.StaticMapEntity.getTileSpaceBounds();
                if (rect.containsPoint(worldX, worldY)) {
                    result.push(content);
                }
            }

            return result;
        },

        /**
         * Returns the chunks contents from the given local coordinates
         * @param {number} localX
         * @param {number} localY
         * @returns {Entity=}
         */
        getTileContentFromLocalCoords(localX, localY) {
            assert(localX >= 0, "Local X is < 0");
            assert(localY >= 0, "Local Y is < 0");
            assert(localX < globalConfig.mapChunkSize, "Local X is >= chunk size");
            assert(localY < globalConfig.mapChunkSize, "Local Y is >= chunk size");

            return this.contents[localX][localY]?.[0] || null;
        },

        /**
         * Sets the chunks contents
         * @param {number} tileX
         * @param {number} tileY
         * @param {Entity} contents
         * @param {Layer} layer
         * @param {boolean} place
         */
        setLayerContentFromWorldCords(tileX, tileY, contents, layer, place) {
            assert(contents, "Enity can not be null");
            const localX = Math.floor(tileX - this.tileX);
            const localY = Math.floor(tileY - this.tileY);
            assert(localX >= 0, "Local X is < 0");
            assert(localY >= 0, "Local Y is < 0");
            assert(localX < globalConfig.mapChunkSize, "Local X is >= chunk size");
            assert(localY < globalConfig.mapChunkSize, "Local Y is >= chunk size");

            /** @type {Array<Entity>} */
            let oldContents;
            if (layer === "regular") {
                oldContents = this.contents[localX][localY];
            } else {
                oldContents = this.wireContents[localX][localY];
            }

            if (!oldContents) {
                if (layer === "regular") {
                    this.contents[localX][localY] = [];
                } else {
                    this.wireContents[localX][localY] = [];
                }
            }

            if (oldContents) {
                const staticComp = contents.components.StaticMapEntity;
                for (const otherEntity of oldContents) {
                    const otherStaticComp = otherEntity.components.StaticMapEntity;
                    if (staticComp.intersects(otherStaticComp)) {
                        fastArrayDeleteValueIfContained(this.containedEntities, otherEntity);
                        fastArrayDeleteValueIfContained(this.containedEntitiesByLayer[layer], otherEntity);

                        if (layer === "regular") {
                            fastArrayDeleteValueIfContained(this.contents[localX][localY], otherEntity);
                        } else {
                            fastArrayDeleteValueIfContained(this.wireContent[localX][localY], otherEntity);
                        }
                    }
                }
            }

            if (!place) {
                return;
            }

            if (layer === "regular") {
                this.contents[localX][localY].push(contents);
            } else {
                this.wireContents[localX][localY].push(contents);
            }

            if (this.containedEntities.indexOf(contents) < 0) {
                this.containedEntities.push(contents);
            }

            if (this.containedEntitiesByLayer[layer].indexOf(contents) < 0) {
                this.containedEntitiesByLayer[layer].push(contents);
            }
        },

        /**
         * Returns the contents of this chunk from the given world space coordinates
         * @param {number} worldX
         * @param {number} worldY
         * @param {Layer} layer
         * @returns {Entity=}
         */
        getLayerContentFromWorldCoords(worldX, worldY, layer) {
            const localX = Math.floor(worldX - this.tileX);
            const localY = Math.floor(worldY - this.tileY);
            assert(localX >= 0, "Local X is < 0");
            assert(localY >= 0, "Local Y is < 0");
            assert(localX < globalConfig.mapChunkSize, "Local X is >= chunk size");
            assert(localY < globalConfig.mapChunkSize, "Local Y is >= chunk size");

            let contents;
            if (layer === "regular") {
                contents = this.contents[localX][localY] || null;
            } else {
                contents = this.wireContents[localX][localY] || null;
            }

            if (!contents) {
                return;
            }

            for (let i = 0; i < contents.length; i++) {
                /** @type {Entity} */
                const content = contents[i];

                /** @ts-ignore @type {RotatableRectangle} */
                const rect = content.components.StaticMapEntity.getTileSpaceBounds();
                if (rect.containsPoint(worldX, worldY)) {
                    return content;
                }
            }
        },

        /**
         * Returns the contents of this chunk from the given world space coordinates
         * @param {number} tileX
         * @param {number} tileY
         * @param {Layer} layer
         * @returns {Entity}
         */
        getLayerContentFromTileCoords(tileX, tileY, layer) {
            const localX = Math.floor(tileX);
            const localY = Math.floor(tileY);
            assert(localX >= 0, "Local X is < 0");
            assert(localY >= 0, "Local Y is < 0");
            assert(localX < globalConfig.mapChunkSize, "Local X is >= chunk size");
            assert(localY < globalConfig.mapChunkSize, "Local Y is >= chunk size");

            let contents;
            if (layer === "regular") {
                contents = this.contents[localX][localY] || null;
            } else {
                contents = this.wireContents[localX][localY] || null;
            }

            if (!contents) {
                return;
            }

            for (let i = 0; i < contents.length; i++) {
                /** @type {Entity} */
                const content = contents[i];

                const rect = content.components.StaticMapEntity.getTileSpaceBounds();
                if (rect.containsPoint(tileX + this.tileX, tileY + this.tileY)) {
                    return content;
                }
            }
        },

        /**
         * Returns the contents of this chunk from the given world space coordinates
         * @param {number} worldX
         * @param {number} worldY
         * @param {Layer} layer
         * @returns {Array<Entity>=}
         */
        getLayerContentsFromTileCoords(worldX, worldY, layer) {
            const localX = Math.floor(worldX - this.tileX);
            const localY = Math.floor(worldY - this.tileY);
            assert(localX >= 0, "Local X is < 0");
            assert(localY >= 0, "Local Y is < 0");
            assert(localX < globalConfig.mapChunkSize, "Local X is >= chunk size");
            assert(localY < globalConfig.mapChunkSize, "Local Y is >= chunk size");

            return layer === "regular"
                ? this.contents[localX][localY] || []
                : this.wireContents[localX][localY] || [];
        },
    }));
}
