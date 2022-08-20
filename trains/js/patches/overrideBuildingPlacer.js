import { globalConfig } from "shapez/core/config";
import { DrawParameters } from "shapez/core/draw_parameters";
import { drawRotatedSprite } from "shapez/core/draw_utils";
import { Loader } from "shapez/core/loader";
import {
    enumDirection,
    enumDirectionToAngle,
    enumDirectionToVector,
    enumInvertedDirections,
    Vector,
} from "shapez/core/vector";
import { getCodeFromBuildingData } from "shapez/game/building_codes";
import { StaticMapEntityComponent } from "shapez/game/components/static_map_entity";
import { Entity } from "shapez/game/entity";
import { HUDBuildingPlacer } from "shapez/game/hud/parts/building_placer";
import { ModInterface } from "shapez/mods/mod_interface";
import { RotatableRectangle } from "../tools/rotatableRectangle";

/**
 * @param {ModInterface} modInterface
 */
export function overrideBuildingPlacer(modInterface) {
    modInterface.extendClass(HUDBuildingPlacer, ({ $super, $old }) => ({
        /**
         * @param {DrawParameters} parameters
         */
        drawRegularPlacement(parameters) {
            const mousePosition = this.root.app.mousePosition;
            if (!mousePosition) {
                // Not on screen
                return;
            }

            const metaBuilding = this.currentMetaBuilding.get();

            /** @type {Vector} */
            const worldPos = this.root.camera.screenToWorld(mousePosition);
            const mouseTile = worldPos.divideScalar(globalConfig.tileSize).subScalar(0.5);

            // Compute best rotation variant
            const { rotation, rotationVariant, connectedEntities } =
                metaBuilding.computeOptimalDirectionAndRotationVariantAtTile({
                    root: this.root,
                    tile: mouseTile,
                    rotation: this.currentBaseRotation,
                    variant: this.currentVariant.get(),
                    layer: metaBuilding.getLayer(),
                });

            // // Check if there are connected entities
            // if (connectedEntities) {
            //     for (let i = 0; i < connectedEntities.length; ++i) {
            //         const connectedEntity = connectedEntities[i];
            //         const connectedWsPoint = connectedEntity.components.StaticMapEntity.getTileSpaceBounds()
            //             .getCenter()
            //             .toWorldSpace();

            //         const startWsPoint = mouseTile.toWorldSpaceCenterOfTile();

            //         const startOffset = connectedWsPoint
            //             .sub(startWsPoint)
            //             .normalize()
            //             .multiplyScalar(globalConfig.tileSize * 0.3);
            //         const effectiveStartPoint = startWsPoint.add(startOffset);
            //         const effectiveEndPoint = connectedWsPoint.sub(startOffset);

            //         parameters.context.globalAlpha = 0.6;

            //         // parameters.context.lineCap = "round";
            //         parameters.context.strokeStyle = "#7f7";
            //         parameters.context.lineWidth = 10;
            //         parameters.context.beginPath();
            //         parameters.context.moveTo(effectiveStartPoint.x, effectiveStartPoint.y);
            //         parameters.context.lineTo(effectiveEndPoint.x, effectiveEndPoint.y);
            //         parameters.context.stroke();
            //         parameters.context.globalAlpha = 1;
            //         // parameters.context.lineCap = "square";
            //     }
            // }

            // Synchronize rotation and origin
            this.fakeEntity.layer = metaBuilding.getLayer();
            const staticComp = this.fakeEntity.components.StaticMapEntity;
            staticComp.origin = mouseTile;
            staticComp.rotation = rotation;
            metaBuilding.updateVariants(this.fakeEntity, rotationVariant, this.currentVariant.get());
            staticComp.code = getCodeFromBuildingData(
                this.currentMetaBuilding.get(),
                this.currentVariant.get(),
                rotationVariant
            );

            const [canBuild, hitEntities] = this.root.logic.checkCanPlaceEntity(this.fakeEntity, {});

            /** @ts-ignore @type {RotatableRectangle} */
            const rotatedRect = staticComp.getTileSpaceBounds().allScaled(globalConfig.tileSize);

            const nodes = rotatedRect.nodes;
            const ctx = parameters.context;

            ctx.globalAlpha = 0.5;
            const effectiveRect = rotatedRect.getEffectiveRectangle();
            ctx.strokeStyle = "yellow";
            ctx.strokeRect(effectiveRect.x, effectiveRect.y, effectiveRect.w, effectiveRect.h);

            ctx.strokeStyle = canBuild ? "green" : "red";
            ctx.beginPath();
            ctx.moveTo(nodes[0].x, nodes[0].y);
            for (let j = 1; j < nodes.length; ++j) {
                const node = nodes[j];
                ctx.lineTo(node.x, node.y);
            }
            ctx.closePath();
            ctx.stroke();

            for (const hitEntity of hitEntities) {
                const staticComp = hitEntity.components.StaticMapEntity;
                const hitRotatedRect = staticComp.getTileSpaceBounds().allScaled(globalConfig.tileSize);

                const nodes = hitRotatedRect.nodes;
                ctx.strokeStyle = "red";
                ctx.fillStyle = canBuild ? "orange" : "red";
                ctx.beginPath();
                ctx.moveTo(nodes[0].x, nodes[0].y);
                for (let j = 1; j < nodes.length; ++j) {
                    const node = nodes[j];
                    ctx.lineTo(node.x, node.y);
                }
                ctx.closePath();
                ctx.stroke();
                ctx.fill();
            }

            ctx.globalAlpha = 1;

            // HACK to draw the entity sprite
            const previewSprite = metaBuilding.getBlueprintSprite(rotationVariant, this.currentVariant.get());
            staticComp.origin = worldPos.divideScalar(globalConfig.tileSize).subScalar(0.5);
            staticComp.drawSpriteOnBoundsClipped(parameters, previewSprite);
            staticComp.origin = mouseTile;

            // // Draw ejectors
            // if (canBuild) {
            //     this.drawMatchingAcceptorsAndEjectors(parameters);
            // }
        },

        /**
         * @param {DrawParameters} parameters
         */
        drawMatchingAcceptorsAndEjectors(parameters) {
            /** @type {Entity} */
            const entity = this.fakeEntity;
            const acceptorComp = entity.components.ItemAcceptor;
            const ejectorComp = entity.components.ItemEjector;
            const staticComp = entity.components.StaticMapEntity;
            const beltComp = entity.components.Belt;
            const minerComp = entity.components.Miner;

            const goodArrowSprite = Loader.getSprite("sprites/misc/slot_good_arrow.png");
            const badArrowSprite = Loader.getSprite("sprites/misc/slot_bad_arrow.png");

            // Just ignore the following code please ... thanks!

            const offsetShift = 10;

            /**
             * @type {Array<import("shapez/game/components/item_acceptor").ItemAcceptorSlot>}
             */
            let acceptorSlots = [];
            /**
             * @type {Array<import("shapez/game/components/item_ejector").ItemEjectorSlot>}
             */
            let ejectorSlots = [];

            if (ejectorComp) {
                ejectorSlots = ejectorComp.slots.slice();
            }

            if (acceptorComp) {
                acceptorSlots = acceptorComp.slots.slice();
            }

            if (beltComp) {
                const fakeEjectorSlot = beltComp.getFakeEjectorSlot();
                const fakeAcceptorSlot = beltComp.getFakeAcceptorSlot();
                ejectorSlots.push(fakeEjectorSlot);
                acceptorSlots.push(fakeAcceptorSlot);
            }

            // Go over all slots
            for (let i = 0; i < acceptorSlots.length; ++i) {
                const slot = acceptorSlots[i];

                const acceptorSlotWsTile = staticComp.localTileToWorld(slot.pos);

                const direction = slot.direction;
                const worldDirection = staticComp.localDirectionToWorld(direction);

                // Figure out which tile ejects to this slot
                const sourceTile = acceptorSlotWsTile.add(enumDirectionToVector[worldDirection]);

                let isBlocked = false;
                let isConnected = false;

                // Find all entities which are on that tile
                const sourceEntities = this.root.map.getLayersContentsMultipleXY(sourceTile.x, sourceTile.y);

                // Check for every entity:
                for (let j = 0; j < sourceEntities.length; ++j) {
                    const sourceEntity = sourceEntities[j];
                    const sourceEjector = sourceEntity.components.ItemEjector;
                    const sourceBeltComp = sourceEntity.components.Belt;
                    const sourceStaticComp = sourceEntity.components.StaticMapEntity;
                    const ejectorAcceptLocalTile = sourceStaticComp.worldToLocalTile(acceptorSlotWsTile);

                    // If this entity is on the same layer as the slot - if so, it can either be
                    // connected, or it can not be connected and thus block the input
                    if (sourceEjector && sourceEjector.anySlotEjectsToLocalTile(ejectorAcceptLocalTile)) {
                        // This one is connected, all good
                        isConnected = true;
                    } else if (
                        sourceBeltComp &&
                        sourceStaticComp.localDirectionToWorld(sourceBeltComp.direction) ===
                            enumInvertedDirections[worldDirection]
                    ) {
                        // Belt connected
                        isConnected = true;
                    } else {
                        // This one is blocked
                        isBlocked = true;
                    }
                }

                const acceptorSlotWsPos = staticComp
                    // @ts-ignore
                    .localTileToRealWorld(slot.pos)
                    .toWorldSpaceCenterOfTile();
                const rotation = staticComp.rotation;
                const alpha = isConnected || isBlocked ? 1.0 : 0.3;
                const sprite = isBlocked ? badArrowSprite : goodArrowSprite;

                parameters.context.globalAlpha = alpha;
                drawRotatedSprite({
                    parameters,
                    sprite,
                    x: acceptorSlotWsPos.x,
                    y: acceptorSlotWsPos.y,
                    // @ts-ignore
                    angle: Math.radians((rotation + 180) % 360),
                    size: 13,
                    offsetY: offsetShift + 13,
                });
                parameters.context.globalAlpha = 1;
            }

            // Go over all slots
            for (let ejectorSlotIndex = 0; ejectorSlotIndex < ejectorSlots.length; ++ejectorSlotIndex) {
                const slot = ejectorSlots[ejectorSlotIndex];

                const ejectorSlotLocalTile = slot.pos.add(enumDirectionToVector[slot.direction]);
                const ejectorSlotWsTile = staticComp.localTileToWorld(ejectorSlotLocalTile);

                const ejectorSlotWsDirection = staticComp.localDirectionToWorld(slot.direction);

                let isBlocked = false;
                let isConnected = false;

                // Find all entities which are on that tile
                const destEntities = this.root.map.getLayersContentsMultipleXY(
                    ejectorSlotWsTile.x,
                    ejectorSlotWsTile.y
                );

                // Check for every entity:
                for (let i = 0; i < destEntities.length; ++i) {
                    const destEntity = destEntities[i];
                    const destAcceptor = destEntity.components.ItemAcceptor;
                    const destStaticComp = destEntity.components.StaticMapEntity;
                    const destMiner = destEntity.components.Miner;

                    const destLocalTile = destStaticComp.worldToLocalTile(ejectorSlotWsTile);
                    const destLocalDir = destStaticComp.worldDirectionToLocal(ejectorSlotWsDirection);
                    if (destAcceptor && destAcceptor.findMatchingSlot(destLocalTile, destLocalDir)) {
                        // This one is connected, all good
                        isConnected = true;
                    } else if (destEntity.components.Belt && destLocalDir === enumDirection.top) {
                        // Connected to a belt
                        isConnected = true;
                    } else if (minerComp && minerComp.chainable && destMiner && destMiner.chainable) {
                        // Chainable miners connected to eachother
                        isConnected = true;
                    } else {
                        // This one is blocked
                        isBlocked = true;
                    }
                }

                const ejectorSLotWsPos = staticComp
                    // @ts-ignore
                    .localTileToRealWorld(ejectorSlotLocalTile)
                    .toWorldSpaceCenterOfTile();
                const rotation = staticComp.rotation;
                const alpha = isConnected || isBlocked ? 1.0 : 0.3;
                const sprite = isBlocked ? badArrowSprite : goodArrowSprite;

                parameters.context.globalAlpha = alpha;
                drawRotatedSprite({
                    parameters,
                    sprite,
                    x: ejectorSLotWsPos.x,
                    y: ejectorSLotWsPos.y,
                    // @ts-ignore
                    angle: Math.radians(rotation),
                    size: 13,
                    offsetY: offsetShift,
                });
                parameters.context.globalAlpha = 1;
            }
        },
    }));
}
