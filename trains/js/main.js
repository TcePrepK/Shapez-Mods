import { globalConfig } from "shapez/core/config";
import { Rectangle } from "shapez/core/rectangle";
import { Vector } from "shapez/core/vector";
import { Component } from "shapez/game/component";
import { GameSystem } from "shapez/game/game_system";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { BaseHUDPart } from "shapez/game/hud/base_hud_part";
import { HUDSandboxController } from "shapez/game/hud/parts/sandbox_controller";
import { StaticMapEntitySystem } from "shapez/game/systems/static_map_entity";
import { Mod } from "shapez/mods/mod";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { MetaRailBuilding } from "./buildings/rails";
import { RailComponent } from "./components/railComponent";
import { HUDEnableSandbox } from "./huds/enableSandbox";
import { overrideBuildingPlacer } from "./patches/overrideBuildingPlacer";
import { overrideBuildingPlacerLogic } from "./patches/overrideBuildingPlacerLogic";
import { overrideCamera } from "./patches/overrideCamera";
import { overrideLogic } from "./patches/overrideLogic";
import { overrideMap } from "./patches/overrideMap";
import { overrideMapChunk } from "./patches/overrideMapChunk";
import { overrideMapChunkView } from "./patches/overrideMapChunkView";
import { overrideStaleAreaDetector } from "./patches/overrideStaleAreaDetector";
import { overrideStaticMapEntity } from "./patches/overrideStaticMapEntity";
import { overrideVector } from "./patches/overrideVector";
import { RailSystem } from "./systems/railSystem";
import { RotatableRectangle } from "./tools/rotatableRectangle";

class ModImpl extends Mod {
    init() {
        overrideBuildingPlacer(this.modInterface);
        overrideBuildingPlacerLogic(this.modInterface);
        overrideCamera(this.modInterface);
        overrideLogic(this.modInterface);
        overrideMap(this.modInterface);
        overrideMapChunk(this.modInterface);
        overrideMapChunkView(this.modInterface);
        overrideStaleAreaDetector(this.modInterface);
        overrideStaticMapEntity();
        overrideVector(this.modInterface);
        // fixStaticMapEntity(this.modInterface);
        // this.registerComponent(RailComponent);
        // this.registerBuilding(MetaRailBuilding);
        // this.registerToolbar(MetaRailBuilding, "regular", "primary");
        // this.registerSystem(RailSystem, true);

        this.modInterface.replaceMethod(
            StaticMapEntitySystem,
            "drawChunk",
            function ($original, [parameters, chunk]) {
                if (shapez.G_IS_DEV && globalConfig.debug.doNotRenderStatics) {
                    return;
                }

                const contents = chunk.containedEntitiesByLayer.regular;
                for (let i = 0; i < contents.length; ++i) {
                    const entity = contents[i];

                    const staticComp = entity.components.StaticMapEntity;
                    const sprite = staticComp.getSprite();
                    if (!sprite) {
                        continue;
                    }

                    // Avoid drawing an entity twice which has been drawn for
                    // another chunk already
                    if (this.drawnUids.has(entity.uid)) {
                        continue;
                    }

                    this.drawnUids.add(entity.uid);
                    staticComp.drawSpriteOnBoundsClipped(parameters, sprite, 2);

                    /** @ts-ignore @type {RotatableRectangle} */
                    const rotatedRect = staticComp.getTileSpaceBounds().allScaled(globalConfig.tileSize);

                    const nodes = rotatedRect.nodes;
                    const ctx = parameters.context;

                    ctx.globalAlpha = 0.5;
                    const effectiveRect = rotatedRect.getEffectiveRectangle();
                    ctx.strokeStyle = "yellow";
                    ctx.strokeRect(effectiveRect.x, effectiveRect.y, effectiveRect.w, effectiveRect.h);

                    ctx.strokeStyle = "red";
                    ctx.beginPath();
                    ctx.moveTo(nodes[0].x, nodes[0].y);
                    for (let j = 1; j < nodes.length + 1; ++j) {
                        const node = nodes[j % nodes.length];
                        ctx.lineTo(node.x, node.y);
                    }
                    ctx.stroke();

                    ctx.globalAlpha = 1;
                }
            }
        );

        this.registerHUD(HUDEnableSandbox, false);
        this.modInterface.registerHudElement("sandboxController", HUDSandboxController);
    }

    /**
     * @param {typeof Component} component
     */
    registerComponent(component) {
        this.modInterface.registerComponent(component);
    }

    /**
     * @param {typeof ModMetaBuilding} building
     */
    registerBuilding(building) {
        this.modInterface.registerNewBuilding({
            metaClass: building,
        });
    }

    /**
     *
     * @param {typeof ModMetaBuilding} building
     * @param {"regular"|"wires"} toolbar
     * @param {"primary"|"secondary"} location
     */
    registerToolbar(building, toolbar, location) {
        this.modInterface.addNewBuildingToToolbar({
            metaClass: building,
            toolbar,
            location,
        });
    }

    /**
     * @param {typeof GameSystem} system
     * @param {Boolean} draw
     */
    registerSystem(system, draw) {
        this.modInterface.registerGameSystem({
            // @ts-ignore
            id: system.getId(),
            systemClass: system,
            before: "belt",
            drawHooks: draw ? ["staticAfter"] : [],
        });
    }

    /**
     * @param {typeof BaseHUDPart} hud
     * @param {boolean} draw
     */
    registerHUD(hud, draw) {
        // @ts-ignore
        this.modInterface.registerHudElement(hud.getId(), hud);
    }
}
