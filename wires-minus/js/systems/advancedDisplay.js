import { disableImageSmoothing, enableImageSmoothing } from "shapez/core/buffer_utils";
import { globalConfig } from "shapez/core/config";
import { DrawParameters } from "shapez/core/draw_parameters";
import { gMetaBuildingRegistry } from "shapez/core/global_registries";
import { Loader } from "shapez/core/loader";
import { Rectangle } from "shapez/core/rectangle";
import { AtlasSprite } from "shapez/core/sprites";
import { StaleAreaDetector } from "shapez/core/stale_area_detector";
import { Vector } from "shapez/core/vector";
import { getCodeFromBuildingData } from "shapez/game/building_codes";
import { Entity } from "shapez/game/entity";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { MapChunk } from "shapez/game/map_chunk";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { GameRoot } from "shapez/game/root";
import { MetaAdvancedDisplay, arrayDisplayRotationVariantToType } from "../buildings/displayManagers";
import { FiberPinsComponent } from "../components/fiberPins";
import { AdvancedDisplayComponent } from "../components/wirelessDisplay";
import { DisplayManager } from "../core/displayManager";
import { DisplayNetwork } from "../core/displayNetwork";
import { FiberEditor } from "../core/fiberEditor";

export class AdvancedDisplaySystem extends GameSystemWithFilter {
    static getId() {
        return "advancedDisplay";
    }

    /**
     * @param {GameRoot} root
     * @returns {AdvancedDisplaySystem}
     */
    static get(root) {
        return root.systemMgr.systems[this.getId()];
    }

    /** @type {StaleAreaDetector} */ staleArea = null;
    /** @type {AtlasSprite} */ pinSprite = null;

    constructor(root) {
        super(root, [AdvancedDisplayComponent]);

        this.root.signals.entityAdded.add(this.entityAdded, this);
        this.root.signals.entityDestroyed.add(this.entityRemoved, this);
        this.root.signals.entityQueuedForDestroy.add(this.preEntityRemoved, this);

        this.staleArea = new StaleAreaDetector({
            root: this.root,
            name: "displays",
            recomputeMethod: this.updateSurroundingDisplayPlacement.bind(this),
        });

        this.pinSprite = Loader.getSprite("sprites/miscs/fiber_pin.png");
    }

    update() {
        this.staleArea.update();
    }

    /**
     * @param {Entity} entity
     */
    entityAdded(entity) {
        const displayComp = AdvancedDisplayComponent.get(entity);
        if (!displayComp) {
            return;
        }

        DisplayManager.get(this.root).addDisplayToNetwork(entity);

        const staticComp = entity.components.StaticMapEntity;
        const affectedArea = staticComp.getTileSpaceBounds().expandedInAllDirections(1);
        this.staleArea.invalidate(affectedArea);
    }

    preEntityRemoved(entity) {
        FiberEditor.get(this.root).entityDestroyed(entity);
        DisplayNetwork.toggleOffParent(entity);
    }

    /**
     * @param {Entity} entity
     */
    entityRemoved(entity) {
        const displayComp = AdvancedDisplayComponent.get(entity);
        if (!displayComp) {
            return;
        }

        const network = displayComp.linkedNetwork;
        network.removeDisplay(entity);
        network.displays.forEach(d => (AdvancedDisplayComponent.get(d).linkedNetwork = null));

        const manager = DisplayManager.get(this.root);
        manager.destroyNetwork(network);
        network.displays.forEach(manager.addDisplayToNetwork, manager);

        const staticComp = entity.components.StaticMapEntity;
        const affectedArea = staticComp.getTileSpaceBounds().expandedInAllDirections(1);
        this.staleArea.invalidate(affectedArea);
    }

    /**
     * @param {Rectangle} affectedArea
     */
    updateSurroundingDisplayPlacement(affectedArea) {
        const metaDisplay = gMetaBuildingRegistry.findByClass(MetaAdvancedDisplay);

        for (let y = affectedArea.y; y < affectedArea.bottom(); y++) {
            for (let x = affectedArea.x; x < affectedArea.right(); x++) {
                const targetEntities = this.root.map.getLayersContentsMultipleXY(x, y);
                for (const entity of targetEntities) {
                    const displayComp = AdvancedDisplayComponent.get(entity);
                    if (!displayComp) {
                        continue;
                    }

                    const staticComp = entity.components.StaticMapEntity;
                    const variant = staticComp.getVariant();

                    const { rotation, rotationVariant } =
                        metaDisplay.computeOptimalDirectionAndRotationVariantAtTile({
                            root: this.root,
                            tile: new Vector(x, y),
                            rotation: staticComp.originalRotation,
                            variant,
                            layer: entity.layer,
                        });

                    const newType = arrayDisplayRotationVariantToType[rotationVariant];
                    if (staticComp.rotation !== rotation || newType !== displayComp.type) {
                        staticComp.rotation = rotation;
                        metaDisplay.updateVariants(entity, rotationVariant, variant);
                        staticComp.code = getCodeFromBuildingData(
                            metaDisplay,
                            defaultBuildingVariant,
                            rotationVariant
                        );

                        this.root.signals.entityChanged.dispatch(entity);
                    }
                }
            }
        }
    }

    /**
     * @param {DrawParameters} parameters
     * @param {MapChunk} chunk
     */
    drawChunk(parameters, chunk) {
        const ctx = parameters.context;

        const contents = chunk.containedEntities;
        for (const entity of contents) {
            const displayComp = AdvancedDisplayComponent.get(entity);
            if (!displayComp) {
                continue;
            }

            const network = displayComp.linkedNetwork;
            if (!network.doesHaveFiberConnection()) {
                continue;
            }

            const staticComp = entity.components.StaticMapEntity;
            const origin = staticComp.origin.toWorldSpace();

            disableImageSmoothing(ctx);
            ctx.drawImage(displayComp.canvas, origin.x, origin.y);
            enableImageSmoothing(ctx);
        }
    }

    /**
     * @param {DrawParameters} parameters
     * @param {MapChunk} chunk
     */
    drawWiresChunk(parameters, chunk) {
        const contents = chunk.containedEntities;
        for (const entity of contents) {
            if (!DisplayNetwork.isParent(entity)) {
                continue;
            }

            const fiberPins = FiberPinsComponent.get(entity);
            if (!fiberPins) {
                continue;
            }

            const pin = fiberPins.slots[0];
            const staticComp = entity.components.StaticMapEntity;
            const pos = FiberEditor.positionOfSlot(staticComp, pin);

            const size = globalConfig.tileSize;
            this.pinSprite.drawCached(parameters, pos.x - size / 2, pos.y - size / 2, size, size);
        }
    }
}
