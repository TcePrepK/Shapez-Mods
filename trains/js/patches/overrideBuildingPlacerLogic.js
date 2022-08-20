import { globalConfig } from "shapez/core/config";
import { gMetaBuildingRegistry } from "shapez/core/global_registries";
import { InputDistributor } from "shapez/core/input_distributor";
import { STOP_PROPAGATION } from "shapez/core/signal";
import { epsilonCompare } from "shapez/core/utils";
import { Vector } from "shapez/core/vector";
import { MetaHubBuilding } from "shapez/game/buildings/hub";
import { enumMinerVariants, MetaMinerBuilding } from "shapez/game/buildings/miner";
import { getBuildingDataFromCode } from "shapez/game/building_codes";
import { enumMouseButton } from "shapez/game/camera";
import { HUDBuildingPlacerLogic } from "shapez/game/hud/parts/building_placer_logic";
import { KEYCODES, KEYMAPPINGS } from "shapez/game/key_action_mapper";
import { MapChunk } from "shapez/game/map_chunk";
import { enumHubGoalRewards } from "shapez/game/tutorial_goals";
import { ModInterface } from "shapez/mods/mod_interface";
import { SOUNDS } from "shapez/platform/sound";

/**
 * @param {ModInterface} modInterface
 */
export function overrideBuildingPlacerLogic(modInterface) {
    modInterface.extendClass(HUDBuildingPlacerLogic, ({ $super, $old }) => ({
        /**
         * Initializes all bindings
         */
        initializeBindings() {
            // KEYBINDINGS
            // keyActionMapper.getBinding(KEYMAPPINGS.placement.rotateWhilePlacing).add(this.tryRotate, this);

            const keyActionMapper = this.root.keyMapper;
            keyActionMapper.getBinding(KEYMAPPINGS.placement.rotateToUp).add(this.trySetRotate, this);
            keyActionMapper.getBinding(KEYMAPPINGS.placement.rotateToDown).add(this.trySetRotate, this);
            keyActionMapper.getBinding(KEYMAPPINGS.placement.rotateToRight).add(this.trySetRotate, this);
            keyActionMapper.getBinding(KEYMAPPINGS.placement.rotateToLeft).add(this.trySetRotate, this);

            keyActionMapper
                .getBinding(KEYMAPPINGS.placement.cycleBuildingVariants)
                .add(this.cycleVariants, this);
            keyActionMapper
                .getBinding(KEYMAPPINGS.placement.switchDirectionLockSide)
                .add(this.switchDirectionLockSide, this);
            keyActionMapper.getBinding(KEYMAPPINGS.general.back).add(this.abortPlacement, this);
            keyActionMapper.getBinding(KEYMAPPINGS.placement.pipette).add(this.startPipette, this);
            this.root.gameState.inputReciever.keyup.add(this.checkForDirectionLockSwitch, this);

            // BINDINGS TO GAME EVENTS
            this.root.hud.signals.buildingsSelectedForCopy.add(this.abortPlacement, this);
            this.root.hud.signals.pasteBlueprintRequested.add(this.abortPlacement, this);
            this.root.signals.storyGoalCompleted.add(() => this.signals.variantChanged.dispatch());
            this.root.signals.upgradePurchased.add(() => this.signals.variantChanged.dispatch());
            this.root.signals.editModeChanged.add(this.onEditModeChanged, this);

            // MOUSE BINDINGS
            this.root.camera.downPreHandler.add(this.onMouseDown, this);
            this.root.camera.movePreHandler.add(this.onMouseMove, this);
            this.root.camera.upPostHandler.add(this.onMouseUp, this);
        },

        /**
         * Aborts any dragging
         */
        abortDragging() {
            this.currentlyDragging = true;
            this.currentlyDeleting = false;
            this.initialPlacementVector = null;
            this.lastDragTile = null;
            this.lastDragPos = null;
        },

        /**
         * Tries to delete the building under the mouse
         */
        deleteBelowCursor() {
            const mousePosition = this.root.app.mousePosition;
            if (!mousePosition) {
                // Not on screen
                return false;
            }

            /** @type {Vector} */
            const pos = this.root.camera.screenToWorld(mousePosition).divideScalar(globalConfig.tileSize);
            /** @type {MapChunk} */
            const chunk = this.root.map.getOrCreateChunkAtTile(pos.x, pos.y);
            const content = chunk.getLayerContentFromWorldCoords(pos.x, pos.y, this.root.currentLayer);
            if (!content) {
                return false;
            }

            if (this.root.logic.tryDeleteBuilding(content)) {
                this.root.soundProxy.playUi(SOUNDS.destroyBuilding);
                return true;
            }
        },

        /**
         * Starts the pipette function
         */
        startPipette() {
            // Disable in overview
            if (this.root.camera.getIsMapOverlayActive()) {
                return;
            }

            const mousePosition = this.root.app.mousePosition;
            if (!mousePosition) {
                // Not on screen
                return;
            }

            const worldPos = this.root.camera.screenToWorld(mousePosition);
            const tile = worldPos.toTileSpace();

            const contents = this.root.map.getTileContent(tile, this.root.currentLayer);
            if (!contents) {
                const tileBelow = this.root.map.getLowerLayerContentXY(tile.x, tile.y);

                // Check if there's a shape or color item below, if so select the miner
                if (
                    tileBelow &&
                    this.root.app.settings.getAllSettings().pickMinerOnPatch &&
                    this.root.currentLayer === "regular" &&
                    this.root.gameMode.hasResources()
                ) {
                    this.currentMetaBuilding.set(gMetaBuildingRegistry.findByClass(MetaMinerBuilding));

                    // Select chained miner if available, since that's always desired once unlocked
                    if (this.root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_miner_chainable)) {
                        this.currentVariant.set(enumMinerVariants.chainable);
                    }
                } else {
                    this.currentMetaBuilding.set(null);
                }
                return;
            }

            // Try to extract the building
            const buildingCode = contents.components.StaticMapEntity.code;
            const extracted = getBuildingDataFromCode(buildingCode);

            // Disable pipetting the hub
            if (
                extracted.metaInstance.getId() === gMetaBuildingRegistry.findByClass(MetaHubBuilding).getId()
            ) {
                this.currentMetaBuilding.set(null);
                return;
            }

            // Disallow picking excluded buildings
            if (this.root.gameMode.isBuildingExcluded(extracted.metaClass)) {
                this.currentMetaBuilding.set(null);
                return;
            }

            // If the building we are picking is the same as the one we have, clear the cursor.
            if (
                this.currentMetaBuilding.get() &&
                extracted.metaInstance.getId() === this.currentMetaBuilding.get().getId() &&
                extracted.variant === this.currentVariant.get()
            ) {
                this.currentMetaBuilding.set(null);
                return;
            }

            this.currentMetaBuilding.set(extracted.metaInstance);
            this.currentVariant.set(extracted.variant);
            this.currentBaseRotation = contents.components.StaticMapEntity.rotation;
        },

        /**
         * Mousewheel event
         * @param {WheelEvent} event
         */
        onMouseWheel(event) {
            const selectedBuilding = this.currentMetaBuilding.get();
            if (!selectedBuilding) {
                return;
            }

            /** @type {InputDistributor} */
            const inputManager = this.root.app.inputMgr;
            if (!inputManager.keysDown.has(KEYCODES.Shift)) {
                return;
            }

            const delta = Math.sign(event.deltaY);
            const rotation = (360 + delta * 15) % 360;
            this.currentBaseRotation = (this.currentBaseRotation + rotation) % 360;
            const staticComp = this.fakeEntity.components.StaticMapEntity;
            staticComp.rotation = this.currentBaseRotation;

            return STOP_PROPAGATION;
        },

        /**
         * mouse down pre handler
         * @param {Vector} pos
         * @param {enumMouseButton} button
         */
        onMouseDown(pos, button) {
            if (this.root.camera.getIsMapOverlayActive()) {
                // We do not allow dragging if the overlay is active
                return;
            }

            const metaBuilding = this.currentMetaBuilding.get();

            // Placement
            if (button === enumMouseButton.left && metaBuilding) {
                this.currentlyDragging = true;
                this.currentlyDeleting = false;
                this.lastDragTile = this.root.camera.screenToWorld(pos).toTileSpace();
                this.lastDragPos = this.root.camera
                    .screenToWorld(pos)
                    .multiplyScalar(10)
                    .toTileSpace()
                    .divideScalar(10);

                // Place initial building, but only if direction lock is not active
                if (!this.isDirectionLockActive) {
                    if (
                        this.tryPlaceCurrentBuildingAt(
                            this.root.camera
                                .screenToWorld(pos)
                                .divideScalar(globalConfig.tileSize)
                                .subScalar(0.5)
                        )
                    ) {
                        this.root.soundProxy.playUi(metaBuilding.getPlacementSound());
                    }
                }
                return STOP_PROPAGATION;
            }

            // Deletion
            if (
                button === enumMouseButton.right &&
                (!metaBuilding || !this.root.app.settings.getAllSettings().clearCursorOnDeleteWhilePlacing)
            ) {
                this.currentlyDragging = true;
                this.currentlyDeleting = true;
                this.lastDragTile = this.root.camera.screenToWorld(pos).toTileSpace();
                this.lastDragPos = this.root.camera
                    .screenToWorld(pos)
                    .multiplyScalar(10)
                    .toTileSpace()
                    .divideScalar(10);
                if (this.deleteBelowCursor()) {
                    return STOP_PROPAGATION;
                }
            }

            // Cancel placement
            if (button === enumMouseButton.right && metaBuilding) {
                this.currentMetaBuilding.set(null);
            }
        },

        /**
         * mouse move pre handler
         * @param {Vector} pos
         */
        onMouseMove(pos) {
            if (this.root.camera.getIsMapOverlayActive()) {
                return;
            }

            // Check for direction lock
            if (this.isDirectionLockActive) {
                return;
            }

            const metaBuilding = this.currentMetaBuilding.get();
            if ((metaBuilding || this.currentlyDeleting) && this.lastDragTile) {
                const oldPos = this.lastDragPos;
                let newPos = this.root.camera
                    .screenToWorld(pos)
                    .multiplyScalar(10)
                    .toTileSpace()
                    .divideScalar(10);

                // Check if camera is moving, since then we do nothing
                if (this.root.camera.desiredCenter) {
                    this.lastDragTile = this.root.camera.screenToWorld(pos).toTileSpace();
                    this.lastDragPos = newPos;
                    return;
                }

                // Check if anything changed
                if (!oldPos.equals(newPos)) {
                    // Automatic Direction
                    if (
                        metaBuilding &&
                        metaBuilding.getRotateAutomaticallyWhilePlacing(this.currentVariant.get()) &&
                        !this.root.keyMapper.getBinding(
                            KEYMAPPINGS.placementModifiers.placementDisableAutoOrientation
                        ).pressed
                    ) {
                        const delta = newPos.sub(oldPos);
                        // @ts-ignore
                        const angleDeg = Math.degrees(delta.angle());
                        this.currentBaseRotation = (Math.round(angleDeg / 90) * 90 + 360) % 360;

                        // Holding alt inverts the placement
                        if (
                            this.root.keyMapper.getBinding(KEYMAPPINGS.placementModifiers.placeInverse)
                                .pressed
                        ) {
                            this.currentBaseRotation = (180 + this.currentBaseRotation) % 360;
                        }
                    }

                    // bresenham
                    let x0 = oldPos.x;
                    let y0 = oldPos.y;
                    let x1 = newPos.x;
                    let y1 = newPos.y;

                    const dx = Math.abs(x1 - x0);
                    const dy = Math.abs(y1 - y0);
                    const sx = x0 < x1 ? 0.1 : -0.1;
                    const sy = y0 < y1 ? 0.1 : -0.1;
                    let err = dx - dy;

                    let anythingPlaced = false;
                    let anythingDeleted = false;

                    while (this.currentlyDeleting || this.currentMetaBuilding.get()) {
                        if (this.currentlyDeleting) {
                            // Deletion
                            const chunk = this.root.map.getOrCreateChunkAtTile(x0, y0);
                            console.log(x0, y0, chunk);
                            const content = chunk.getLayerContentFromWorldCoords(
                                x0,
                                y0,
                                this.root.currentLayer
                            );
                            if (content && !content.queuedForDestroy && !content.destroyed) {
                                if (this.root.logic.tryDeleteBuilding(content)) {
                                    anythingDeleted = true;
                                }
                            }
                        } else {
                            // Placement
                            if (this.tryPlaceCurrentBuildingAt(new Vector(x0, y0))) {
                                anythingPlaced = true;
                            }
                        }

                        if (epsilonCompare(x0, x1, 0.1) && epsilonCompare(y0, y1, 0.1)) break;
                        var e2 = 2 * err;
                        if (e2 > -dy) {
                            err -= dy;
                            x0 += sx;
                        }
                        if (e2 < dx) {
                            err += dx;
                            y0 += sy;
                        }
                    }

                    if (anythingPlaced) {
                        this.root.soundProxy.playUi(metaBuilding.getPlacementSound());
                    }
                    if (anythingDeleted) {
                        this.root.soundProxy.playUi(SOUNDS.destroyBuilding);
                    }
                }

                this.lastDragTile = this.root.camera.screenToWorld(pos).toTileSpace();
                this.lastDragPos = newPos;
                return STOP_PROPAGATION;
            }
        },
    }));
}
