import { Console } from "console";
import { globalConfig } from "shapez/core/config";
import { DrawParameters } from "shapez/core/draw_parameters";
import { gComponentRegistry } from "shapez/core/global_registries";
import { Rectangle } from "shapez/core/rectangle";
import { AtlasSprite } from "shapez/core/sprites";
import { enumDirection, Vector } from "shapez/core/vector";
import { getBuildingDataFromCode } from "shapez/game/building_codes";
import { Component } from "shapez/game/component";
import { StaticMapEntityComponent } from "shapez/game/components/static_map_entity";
import { MetaBuilding } from "shapez/game/meta_building";
import { types } from "shapez/savegame/serialization";
import { RotatableRectangle } from "../tools/rotatableRectangle";

export function overrideStaticMapEntity() {
    const oldSMEprototype = StaticMapEntityComponent.prototype;
    console.warn("📦 Overriding StaticMapEntityComponent");

    shapez.StaticMapEntityComponent = class extends Component {
        static getId() {
            return "StaticMapEntity";
        }

        static getSchema() {
            return {
                origin: types.tileVector,
                rotation: types.float,
                originalRotation: types.float,

                // See building_codes.js
                code: types.uintOrString,
            };
        }

        /**
         * Returns the effective tile size
         * @returns {Vector}
         */
        getTileSize() {
            return getBuildingDataFromCode(this.code).tileSize;
        }

        /**
         * Returns the sprite
         * @returns {AtlasSprite}
         */
        getSprite() {
            return getBuildingDataFromCode(this.code).sprite;
        }

        /**
         * Returns the blueprint sprite
         * @returns {AtlasSprite}
         */
        getBlueprintSprite() {
            return getBuildingDataFromCode(this.code).blueprintSprite;
        }

        /**
         * Returns the silhouette color
         * @returns {string}
         */
        getSilhouetteColor() {
            return getBuildingDataFromCode(this.code).silhouetteColor;
        }

        /**
         * Returns the meta building
         * @returns {MetaBuilding}
         */
        getMetaBuilding() {
            return getBuildingDataFromCode(this.code).metaInstance;
        }

        /**
         * Returns the buildings variant
         * @returns {string}
         */
        getVariant() {
            return getBuildingDataFromCode(this.code).variant;
        }

        /**
         * Returns the buildings rotation variant
         * @returns {number}
         */
        getRotationVariant() {
            return getBuildingDataFromCode(this.code).rotationVariant;
        }

        /**
         * Copy the current state to another component
         * @param {Component} otherComponent
         */
        copyAdditionalStateTo(otherComponent) {
            return new StaticMapEntityComponent({
                origin: this.origin.copy(),
                rotation: this.rotation,
                originalRotation: this.originalRotation,
                code: this.code,
            });
        }

        /**
         * @param {object} param0
         * @param {Vector=} param0.origin Origin (Top Left corner) of the entity
         * @param {Vector=} param0.tileSize Size of the entity in tiles
         * @param {number=} param0.rotation Rotation in degrees. Must be multiple of 90
         * @param {number=} param0.originalRotation Original Rotation in degrees. Must be multiple of 90
         * @param {number|string=} param0.code Building code
         */
        constructor({
            origin = new Vector(),
            tileSize = new Vector(1, 1),
            rotation = 0,
            originalRotation = 0,
            code = 0,
        }) {
            super();

            this.origin = origin;
            this.rotation = rotation;
            this.code = code;
            this.originalRotation = originalRotation;
        }

        /**
         * Returns the effective rectangle of this entity in tile space
         * @returns {RotatableRectangle}
         */
        getTileSpaceBounds() {
            const size = this.getTileSize();
            const center = this.origin.add(size.divideScalar(2));
            const rect = RotatableRectangle.fromCenterAndSize(center, size);
            rect.setCenter(this.origin.addScalar(0.5));
            return rect.rotated(this.rotation);
        }

        /**
         * Transforms the given vector/rotation from local space to world space
         * @param {Vector} vector
         * @returns {Vector}
         */
        applyRotationToVector(vector) {
            return vector.rotatedByDegree(this.rotation);
        }

        /**
         * Transforms the given vector/rotation from world space to local space
         * @param {Vector} vector
         * @returns {Vector}
         */
        unapplyRotationToVector(vector) {
            return vector.rotatedByDegree(360 - this.rotation);
        }

        /**
         * Transforms the given direction from local space
         * @param {enumDirection} direction
         * @returns {enumDirection}
         */
        localDirectionToWorld(direction) {
            const rotation = Math.floor(this.rotation / 90) * 90;
            return Vector.transformDirectionFromMultipleOf90(direction, rotation);
        }

        /**
         * Transforms the given direction from world to local space
         * @param {enumDirection} direction
         * @returns {enumDirection}
         */
        worldDirectionToLocal(direction) {
            const rotation = Math.floor(this.rotation / 90) * 90;
            return Vector.transformDirectionFromMultipleOf90(direction, 360 - rotation);
        }

        /**
         * Transforms from local tile space to global tile space
         * @param {Vector} localTile
         * @returns {Vector}
         */
        localTileToWorld(localTile) {
            const result = localTile.rotatedByDegree(this.rotation).ceil();
            result.x += this.origin.x;
            result.y += this.origin.y;
            return result;
        }

        /**
         * Transforms from local tile space to global tile space
         * @param {Vector} localTile
         * @returns {Vector}
         */
        localTileToRealWorld(localTile) {
            const result = localTile.rotatedByDegree(this.rotation);
            result.x += this.origin.x;
            result.y += this.origin.y;
            return result;
        }

        /**
         * Transforms from world space to local space
         * @param {Vector} worldTile
         */
        worldToLocalTile(worldTile) {
            const localUnrotated = worldTile.sub(this.origin);
            return this.unapplyRotationToVector(localUnrotated);
        }

        /**
         * @param {StaticMapEntityComponent} otherComponent
         */
        intersects(otherComponent) {
            const rect = this.getTileSpaceBounds();
            const otherRect = otherComponent.getTileSpaceBounds();
            // @ts-ignore
            return rect.intersects(otherRect);
        }

        /**
         * Returns whether the entity should be drawn for the given parameters
         * @param {DrawParameters} parameters
         */
        shouldBeDrawn(parameters) {
            let x = 0;
            let y = 0;
            let w = 0;
            let h = 0;
            const size = this.getTileSize();

            const rotation = Math.floor(this.rotation / 90) * 90;
            switch (rotation) {
                case 0: {
                    x = this.origin.x;
                    y = this.origin.y;
                    w = size.x;
                    h = size.y;
                    break;
                }
                case 90: {
                    x = this.origin.x - size.y + 1;
                    y = this.origin.y;
                    w = size.y;
                    h = size.x;
                    break;
                }
                case 180: {
                    x = this.origin.x - size.x + 1;
                    y = this.origin.y - size.y + 1;
                    w = size.x;
                    h = size.y;
                    break;
                }
                case 270: {
                    x = this.origin.x;
                    y = this.origin.y - size.x + 1;
                    w = size.y;
                    h = size.x;
                    break;
                }
                default:
                    assert(false, "Invalid rotation");
            }

            return parameters.visibleRect.containsRect4Params(
                x * globalConfig.tileSize,
                y * globalConfig.tileSize,
                w * globalConfig.tileSize,
                h * globalConfig.tileSize
            );
        }

        /**
         * Draws a sprite over the whole space of the entity
         * @param {DrawParameters} parameters
         * @param {AtlasSprite} sprite
         * @param {number=} extrudePixels How many pixels to extrude the sprite
         * @param {Vector=} overridePosition Whether to drwa the entity at a different location
         */
        drawSpriteOnBoundsClipped(parameters, sprite, extrudePixels = 0, overridePosition = null) {
            if (!this.shouldBeDrawn(parameters) && !overridePosition) {
                return;
            }
            const size = this.getTileSize();
            let worldX = this.origin.x * globalConfig.tileSize;
            let worldY = this.origin.y * globalConfig.tileSize;

            if (overridePosition) {
                worldX = overridePosition.x * globalConfig.tileSize;
                worldY = overridePosition.y * globalConfig.tileSize;
            }

            if (this.rotation === 0) {
                // Early out, is faster
                sprite.drawCached(
                    parameters,
                    worldX - extrudePixels * size.x,
                    worldY - extrudePixels * size.y,
                    globalConfig.tileSize * size.x + 2 * extrudePixels * size.x,
                    globalConfig.tileSize * size.y + 2 * extrudePixels * size.y
                );
            } else {
                const rotationCenterX = worldX + globalConfig.halfTileSize;
                const rotationCenterY = worldY + globalConfig.halfTileSize;

                parameters.context.translate(rotationCenterX, rotationCenterY);
                // @ts-ignore
                parameters.context.rotate(Math.radians(this.rotation));
                sprite.drawCached(
                    parameters,
                    -globalConfig.halfTileSize - extrudePixels * size.x,
                    -globalConfig.halfTileSize - extrudePixels * size.y,
                    globalConfig.tileSize * size.x + 2 * extrudePixels * size.x,
                    globalConfig.tileSize * size.y + 2 * extrudePixels * size.y,
                    false // no clipping possible here
                );
                // @ts-ignore
                parameters.context.rotate(-Math.radians(this.rotation));
                parameters.context.translate(-rotationCenterX, -rotationCenterY);
            }
        }
    };

    fixComponent(oldSMEprototype);
}

function fixComponent(oldPrototype) {
    for (const property in Object.getOwnPropertyDescriptors(oldPrototype)) {
        if (shapez.StaticMapEntityComponent.prototype[property]) {
            continue;
        }
        shapez.StaticMapEntityComponent.prototype[property] = oldPrototype[property];
    }

    gComponentRegistry.entries[0] = shapez.StaticMapEntityComponent;
    gComponentRegistry.idToEntry["StaticMapEntity"] = shapez.StaticMapEntityComponent;
}
