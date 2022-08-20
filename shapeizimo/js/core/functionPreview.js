import { Application } from "shapez/application";
import { DrawParameters } from "shapez/core/draw_parameters";
import { Rectangle } from "shapez/core/rectangle";
import { Vector } from "shapez/core/vector";
import { EntityManager } from "shapez/game/entity_manager";
import { GameMode } from "shapez/game/game_mode";
import { GameSystemManager } from "shapez/game/game_system_manager";
import { HubGoals } from "shapez/game/hub_goals";
import { GameHUD } from "shapez/game/hud/hud";
import { HUDWiresOverlay } from "shapez/game/hud/parts/wires_overlay";
import { MapView } from "shapez/game/map_view";
import { GameRoot } from "shapez/game/root";
import { ShapeDefinitionManager } from "shapez/game/shape_definition_manager";
import { applyGameTheme, THEME, THEMES } from "shapez/game/theme";
import { GameTime } from "shapez/game/time/game_time";
import { SerializerInternal } from "shapez/savegame/serializer_internal";
import { FunctionData } from "./function";
import { FunctionSerializer } from "./functionSerializer";
import { functionsGameModeId } from "./utils";

export class FunctionPreview {
    /**
     * @param {Application} app
     * @param {FunctionData} functionData
     */
    constructor(app, functionData) {
        this.app = app;
        this.functionData = functionData;

        // this.canvasSizeSmall = 64;
        this.canvasSize = 128;

        this.initializeCanvas();
    }

    initialize() {
        return this.initializeRoot();
    }

    initializeRoot() {
        return this.functionData.readAsync().then(() => {
            // Deserialize
            const dump = this.functionData.currentData.dump;
            if (!dump) {
                return;
            }

            this.root = new GameRoot(this.app);
            const root = this.root;

            root.gameMode = GameMode.create(root, functionsGameModeId, { functionDat: this.functionData });
            root.gameMode["zoneWidth"] = this.functionData.currentData.dump.bounds.w;
            root.gameMode["zoneHeight"] = this.functionData.currentData.dump.bounds.h;

            root.map = new MapView(root);
            root.time = new GameTime(root);
            root.entityMgr = new EntityManager(root);
            root.systemMgr = new GameSystemManager(root);
            root.shapeDefinitionMgr = new ShapeDefinitionManager(root);
            root.hubGoals = new HubGoals(root);

            root["wiresOverlay"] = new HUDWiresOverlay(root);
            root["wiresOverlay"].generateTilePattern();

            // root.hud.parts .initialize();

            const serializer = new SerializerInternal();
            for (let i = 0; i < dump.entities.length; ++i) {
                dump.entities[i].uid = i + 10000;
                serializer.deserializeEntity(root, dump.entities[i]);
            }

            // root.systemMgr.systems.belt.deserializePaths(dump.beltPaths);

            // if (root.hud.parts["waypoints"]) {
            //     root.hud.parts["waypoints"].deserialize(dump.waypoints);
            // }
        });
    }

    initializeCanvas() {
        const previewCanvas = document.createElement("canvas");
        previewCanvas.classList.add("preview");
        previewCanvas.width = this.canvasSize;
        previewCanvas.height = this.canvasSize;

        this.previewCanvas = previewCanvas;

        // const wiresCanvas = document.createElement("canvas");
        // wiresCanvas.classList.add("preview", "wires");
        // wiresCanvas.width = this.canvasSize;
        // wiresCanvas.height = this.canvasSize;

        // this.regularCanvas = regularCanvas;
        // this.wiresCanvas = wiresCanvas;

        previewCanvas.addEventListener("mouseenter", () => {
            if (!this.root) {
                return;
            }

            this.root.currentLayer = "wires";
            this.drawCanvas();
        });

        previewCanvas.addEventListener("mouseleave", () => {
            if (!this.root) {
                return;
            }

            this.root.currentLayer = "regular";
            this.drawCanvas();
        });
    }

    drawCanvas() {
        this.functionData.readAsync().then(() => {
            const dump = this.functionData.currentData.dump;
            const width = dump.bounds.w;
            const height = dump.bounds.h;

            const context = this.previewCanvas.getContext("2d");
            context.clearRect(0, 0, this.canvasSize, this.canvasSize);

            const dimension = Math.max(width, height);
            const pixelPerTile = this.canvasSize / dimension;
            const offset = new Vector((dimension - width) / 2, (dimension - height) / 2);
            const zone = new Rectangle(offset.x, offset.y, width, height).allScaled(pixelPerTile);
            const dpi = dimension / (this.canvasSize / 32);

            const parameters = new DrawParameters({
                context,
                visibleRect: new Rectangle(
                    -zone.x * dpi,
                    -zone.y * dpi,
                    this.canvasSize * dpi,
                    this.canvasSize * dpi
                ),
                desiredAtlasScale: 0.25,
                root: this.root,
                zoomLevel: dpi,
            });

            this.root.signals.gameFrameStarted.dispatch();

            context.translate(zone.x, zone.y);
            context.scale(1 / dpi, 1 / dpi);

            // Render all relevant chunks
            this.root.map.drawBackground(parameters);
            this.root.map.drawForeground(parameters);

            if (this.root.currentLayer === "wires") {
                if (this.root["wiresOverlay"]) {
                    this.root["wiresOverlay"].draw(parameters);
                }

                this.root.map.drawWiresForegroundLayer(parameters);
            }

            context.scale(dpi, dpi);
            context.translate(-zone.x, -zone.y);
        });
    }
}
