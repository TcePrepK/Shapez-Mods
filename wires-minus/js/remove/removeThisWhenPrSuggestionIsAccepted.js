import { globalConfig } from "shapez/core/config";
import { DrawParameters } from "shapez/core/draw_parameters";
import { drawRotatedSprite } from "shapez/core/draw_utils";
import { enumDirectionToAngle, Vector } from "shapez/core/vector";
import { getCodeFromBuildingData } from "shapez/game/building_codes";
import { Camera } from "shapez/game/camera";
import { StaticMapEntityComponent } from "shapez/game/components/static_map_entity";
import { Entity } from "shapez/game/entity";
import { KEYMAPPINGS } from "shapez/game/key_action_mapper";
import { MapChunkView } from "shapez/game/map_chunk_view";
import { MetaBuilding } from "shapez/game/meta_building";
import { GameRoot } from "shapez/game/root";
import { WiredPinsSystem } from "shapez/game/systems/wired_pins";
import { ModInterface } from "shapez/mods/mod_interface";

/** @type {Object<ItemType, number>} */
const enumTypeToSize = {
    boolean: 9,
    shape: 9,
    color: 14,
};

/**
 * @param {ModInterface} modInterface
 */
export function removeThis(modInterface) {
    modInterface.extendClass(MetaBuilding, ({ $super, $old }) => ({
        /**
         * Creates the entity without placing it
         * @param {object} param0
         * @param {GameRoot} param0.root
         * @param {Vector} param0.origin Origin tile
         * @param {number=} param0.rotation Rotation
         * @param {number} param0.originalRotation Original Rotation
         * @param {number} param0.rotationVariant Rotation variant
         * @param {string} param0.variant
         */
        createEntity({ root, origin, rotation, originalRotation, rotationVariant, variant }) {
            // @ts-ignore
            const entity = new Entity(root);
            entity.layer = this.getLayer(variant, rotationVariant);
            entity.addComponent(
                new StaticMapEntityComponent({
                    origin: new Vector(origin.x, origin.y),
                    rotation,
                    originalRotation,
                    tileSize: this.getDimensions(variant).copy(),
                    code: getCodeFromBuildingData(this, variant, rotationVariant),
                })
            );
            this.setupEntityComponents(entity, root);
            this.updateVariants(entity, rotationVariant, variant);
            return entity;
        },
    }));

    modInterface.extendClass(WiredPinsSystem, ({ $super, $old }) => ({
        /**
         * Draws a given entity
         * @param {DrawParameters} parameters
         * @param {MapChunkView} chunk
         */
        drawChunk(parameters, chunk) {
            const contents = chunk.containedEntities;

            for (let i = 0; i < contents.length; ++i) {
                const entity = contents[i];
                const pinsComp = entity.components.WiredPins;
                if (!pinsComp) {
                    continue;
                }

                const staticComp = entity.components.StaticMapEntity;
                const slots = pinsComp.slots;

                for (let j = 0; j < slots.length; ++j) {
                    const slot = slots[j];
                    const tile = staticComp.localTileToWorld(slot.pos);

                    if (!chunk.tileSpaceRectangle.containsPoint(tile.x, tile.y)) {
                        // Doesn't belong to this chunk
                        continue;
                    }
                    const worldPos = tile.toWorldSpaceCenterOfTile();

                    // Culling
                    if (
                        !parameters.visibleRect.containsCircle(
                            worldPos.x,
                            worldPos.y,
                            globalConfig.halfTileSize
                        )
                    ) {
                        continue;
                    }

                    // @ts-ignore
                    const effectiveRotation = Math.radians(
                        staticComp.rotation + enumDirectionToAngle[slot.direction]
                    );

                    const variant = staticComp.getVariant();
                    const rotationVariant = staticComp.getRotationVariant();
                    // @ts-ignore
                    if (staticComp.getMetaBuilding().getRenderPins(variant, rotationVariant)) {
                        drawRotatedSprite({
                            parameters,
                            sprite: this.pinSprites[slot.type],
                            x: worldPos.x,
                            y: worldPos.y,
                            angle: effectiveRotation,
                            size: globalConfig.tileSize + 2,
                            offsetX: 0,
                            offsetY: 0,
                        });
                    }

                    // Draw contained item to visualize whats emitted
                    const value = slot.value;
                    if (value) {
                        const offset = new Vector(0, -9.1).rotated(effectiveRotation);

                        value.drawItemCenteredClipped(
                            worldPos.x + offset.x,
                            worldPos.y + offset.y,
                            parameters,
                            enumTypeToSize[value.getItemType()]
                        );
                    }

                    // Debug view
                    // @ts-ignore
                    if (shapez.G_IS_DEV && globalConfig.debug.renderWireNetworkInfos) {
                        const offset = new Vector(0, -10).rotated(effectiveRotation);
                        const network = slot.linkedNetwork;
                        parameters.context.fillStyle = "blue";
                        parameters.context.font = "5px Tahoma";
                        parameters.context.textAlign = "center";
                        parameters.context.fillText(
                            network ? "S" + network.uid : "???",
                            (tile.x + 0.5) * globalConfig.tileSize + offset.x,
                            (tile.y + 0.5) * globalConfig.tileSize + offset.y
                        );
                        parameters.context.textAlign = "left";
                    }
                }
            }
        },
    }));

    modInterface.replaceMethod(Camera, "internalUpdateKeyboardForce", function ($original, [now, dt]) {
        if (!this.currentlyMoving && this.desiredCenter == null) {
            const limitingDimension = Math.min(this.root.gameWidth, this.root.gameHeight);

            const moveAmount = ((limitingDimension / 2048) * dt) / this.zoomLevel;

            let forceX = 0;
            let forceY = 0;

            const actionMapper = this.root.keyMapper;
            if (actionMapper.getBinding(KEYMAPPINGS.navigation.mapMoveUp).pressed) {
                forceY -= 1;
            }

            if (actionMapper.getBinding(KEYMAPPINGS.navigation.mapMoveDown).pressed) {
                forceY += 1;
            }

            if (actionMapper.getBinding(KEYMAPPINGS.navigation.mapMoveLeft).pressed) {
                forceX -= 1;
            }

            if (actionMapper.getBinding(KEYMAPPINGS.navigation.mapMoveRight).pressed) {
                forceX += 1;
            }

            const systems = this.root.systemMgr.systems;
            const keyboardInput = systems["keyboardInput"];
            if (
                !keyboardInput.isAvailableBinding(KEYMAPPINGS.navigation.mapMoveUp.keyCode) ||
                !keyboardInput.isAvailableBinding(KEYMAPPINGS.navigation.mapMoveDown.keyCode)
            ) {
                forceY = 0;
            }

            if (
                !keyboardInput.isAvailableBinding(KEYMAPPINGS.navigation.mapMoveLeft.keyCode) ||
                !keyboardInput.isAvailableBinding(KEYMAPPINGS.navigation.mapMoveRight.keyCode)
            ) {
                forceX = 0;
            }

            let movementSpeed =
                this.root.app.settings.getMovementSpeed() *
                // @ts-ignore
                (actionMapper.getBinding(KEYMAPPINGS.navigation.mapMoveFaster).pressed ? 4 : 1);

            this.center.x += moveAmount * forceX * movementSpeed;
            this.center.y += moveAmount * forceY * movementSpeed;

            this.clampToBounds();
        }
    });
}
