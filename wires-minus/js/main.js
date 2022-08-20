import { globalConfig } from "shapez/core/config";
import { createLogger } from "shapez/core/logging";
import { STOP_PROPAGATION } from "shapez/core/signal";
import { Vector } from "shapez/core/vector";
import { Component } from "shapez/game/component";
import { GameSystem } from "shapez/game/game_system";
import { BaseHUDPart } from "shapez/game/hud/base_hud_part";
import { GameHUD } from "shapez/game/hud/hud";
import { HUDWiresOverlay } from "shapez/game/hud/parts/wires_overlay";
import { KEYCODES } from "shapez/game/key_action_mapper";
import { MapChunkAggregate } from "shapez/game/map_chunk_aggregate";
import { MapChunkView } from "shapez/game/map_chunk_view";
import { GameRoot } from "shapez/game/root";
import { Mod } from "shapez/mods/mod";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { MetaWirelessDisplayManagers } from "./buildings/display_managers";
import { MetaSignalTransportBuildings } from "./buildings/signal_transport";
import { MetaUserInputBuildings } from "./buildings/user_input_buildings";
import { DynamicRemoteSignalComponent } from "./components/dynamic_remote_signal";
import { KeyboardInputComponent } from "./components/keyboard_input";
import { MouseInputComponent } from "./components/mouse_input";
import { QuadSenderComponent } from "./components/quad_sender";
import { SingleSenderComponent } from "./components/single_sender";
import { StaticRemoteSignalComponent } from "./components/static_remote_signal";
import { WirelessCodeComponent } from "./components/wireless_code";
import { WirelessDisplayComponent } from "./components/wireless_display";
import { HUDWirelessCode } from "./huds/wireless_code_hud";
import { removeThis } from "./remove/removeThisWhenPrSuggestionIsAccepted";
import { DynamicRemoteSignalSystem } from "./systems/dynamic_remote_signal_system";
import { KeyboardInputSystem } from "./systems/keyboard_input_system";
import { MouseInputSystem } from "./systems/mouse_input_system";
import { QuadSenderSystem } from "./systems/quad_sender";
import { SingleSenderSystem } from "./systems/single_sender";
import { StaticRemoteSignalSystem } from "./systems/static_remote_signal_system";
import { WirelessCodeSystem } from "./systems/wireless_code_system";
import { WirelessDisplaySystem } from "./systems/wireless_display";
import { WirelessManager } from "./core/wirelessManager";
import { FiberPinsComponent } from "./components/fiber_pins";
import { FiberPinsSystem } from "./systems/fiber_pins_system";
import { ConnectionBoard } from "./core/connection_board";
import { HUDEnableSandbox } from "./debuggers/enableProducer";
import { HUDSandboxController } from "shapez/game/hud/parts/sandbox_controller";

const modLogger = createLogger("shapez-minus");

class ModImpl extends Mod {
    registerAllComponents() {
        this.modLog("Registering components");

        this.registerComponent(WirelessCodeComponent);
        this.registerComponent(FiberPinsComponent);

        this.registerComponent(WirelessDisplayComponent);
        this.registerComponent(SingleSenderComponent);
        this.registerComponent(QuadSenderComponent);

        this.registerComponent(DynamicRemoteSignalComponent);
        this.registerComponent(StaticRemoteSignalComponent);

        this.registerComponent(KeyboardInputComponent);
        this.registerComponent(MouseInputComponent);
    }

    registerAllBuildings() {
        this.modLog("Registering buildings");

        this.registerBuilding(MetaWirelessDisplayManagers, ["regular", "wires"], ["secondary", "secondary"]);
        this.registerBuilding(MetaSignalTransportBuildings, ["wires"], ["secondary"]);
        this.registerBuilding(MetaUserInputBuildings, ["regular", "wires"], ["secondary", "secondary"]);
    }

    registerAllSystems() {
        this.modLog("Registering systems");

        this.registerSystem(FiberPinsSystem, "belt");
        this.registerSystem(StaticRemoteSignalSystem, "logicGate");

        this.registerSystem(WirelessCodeSystem, "belt");
        this.registerSystem(MouseInputSystem, "belt");
        this.registerSystem(KeyboardInputSystem, "belt", ["staticAfter"]);

        this.registerSystem(DynamicRemoteSignalSystem, "belt");
        this.registerSystem(SingleSenderSystem, "belt");
        this.registerSystem(QuadSenderSystem, "belt");
        this.registerSystem(WirelessDisplaySystem, "belt", ["staticAfter"]);
    }

    registerAllHUDs() {
        this.modLog("Registering HUDs");

        this.registerHUD(HUDWirelessCode, true);
        this.registerHUD(ConnectionBoard, true);
    }

    registerAllKeybindings() {
        this.modInterface.registerIngameKeybinding({
            id: "key_reader_override_toggle",
            keyCode: KEYCODES.F7,
            translation: "Toggles override option of Key Reader.",
            /** @param {GameRoot} root */
            handler: root => {
                root.systemMgr.systems["keyboardInput"].toggleOverride();
                return STOP_PROPAGATION;
            },
        });

        this.modInterface.registerIngameKeybinding({
            id: "edit_channels_toggle",
            keyCode: KEYCODES.F8,
            translation: "Toggles channel editing board.",
            /** @param {GameRoot} root */
            handler: root => {
                root.hud.parts["connectionBoard"].toggle();
                return STOP_PROPAGATION;
            },
        });
    }

    runAllOverrides() {
        this.modInterface.runAfterMethod(MapChunkView, "drawWiresForegroundLayer", function (parameters) {
            this.root.systemMgr.systems["quadSender"].drawChunk(parameters, this);
        });

        this.modInterface.runAfterMethod(MapChunkAggregate, "drawOverlay", function (parameters) {
            const chunkPos = new Vector(this.x, this.y).multiplyScalar(globalConfig.chunkAggregateSize);
            for (let i = 0; i < globalConfig.chunkAggregateSize; i++) {
                for (let j = 0; j < globalConfig.chunkAggregateSize; j++) {
                    const chunk = this.root.map.getChunk(chunkPos.x + i, chunkPos.y + j);
                    if (!chunk) {
                        continue;
                    }

                    this.root.systemMgr.systems["wirelessDisplay"].drawChunk(parameters, chunk);
                }
            }
        });

        this.modInterface.runBeforeMethod(HUDWiresOverlay, "switchLayers", function () {
            if (this.root.hud.parts["connectionBoard"].isActive) {
                this.root.currentLayer = "regular";
            }
        });

        removeThis(this.modInterface);
    }

    setupConnectionBoard() {
        this.modLog("Setting up connection board");

        this.signals.gameSerialized.add((root, data) => {
            data.modExtraData.connections = root.hud.parts["connectionBoard"].serialize();
        });

        this.signals.gameDeserialized.add((root, data) => {
            if (data.modExtraData.connections) {
                root.hud.parts["connectionBoard"].deserialize(data.modExtraData.connections);
            }
        });
    }

    setupDebugTools() {
        this.modLog("Setting up debug tools");

        this.registerHUD(HUDEnableSandbox);
        this.modInterface.registerHudElement("sandboxController", HUDSandboxController);
    }

    init() {
        try {
            globalConfig["wirelessManager"] = new WirelessManager();

            this.runAllOverrides();
            this.registerAllComponents();
            this.registerAllBuildings();
            this.registerAllSystems();
            this.registerAllHUDs();
            this.registerAllKeybindings();

            this.setupConnectionBoard();

            this.setupDebugTools();
        } catch (e) {
            this.errorLog(e);
            return;
        }

        this.modLog(" Mod loaded Successfully");
    }

    /**
     * @param {string} message
     */
    modLog(message) {
        modLogger.log("📶 " + message + " 📶");
    }

    /**
     * @param {string} message
     */
    announcementLog(message) {
        modLogger.log("~ " + message);
    }

    /**
     * @param {string} message
     */
    errorLog(message) {
        modLogger.error("❗ Mod failed to load ❗");
        modLogger.error(message);
    }

    /**
     * @param {typeof Component} component
     */
    registerComponent(component) {
        const componentName = component.name;
        this[componentName] = component;

        this.modInterface.registerComponent(component);

        this.announcementLog(`Registered component ${componentName}`);
    }

    /**
     * @param {typeof ModMetaBuilding} building
     * @param {Array<"regular"|"wires">} toolbar
     * @param {Array<"primary"|"secondary">} location
     */
    registerBuilding(building, toolbar, location) {
        const buildingName = building.name;
        this[buildingName] = building;

        this.modInterface.registerNewBuilding({
            metaClass: building,
        });

        const length = Math.max(toolbar.length, location.length);
        for (let i = 0; i < length; i++) {
            const selectedToolbar = toolbar[i] || "regular";
            const selectedLocation = location[i] || "primary";

            this.modInterface.addNewBuildingToToolbar({
                metaClass: building,
                toolbar: selectedToolbar,
                location: selectedLocation,
            });
        }

        this.announcementLog(`Registered building ${buildingName}`);
    }

    /**
     * @param {new (any) => GameSystem} system
     * @param {string=} before
     * @param {Array<string>=} drawHooks
     */
    registerSystem(system, before, drawHooks = []) {
        const systemName = system.name;
        this[systemName] = system;

        const id = systemName.charAt(0).toLowerCase() + systemName.substring(1, systemName.length - 6);

        this.modInterface.registerGameSystem({
            id,
            systemClass: system,
            before,
            drawHooks,
        });

        this.announcementLog(`Registered system ${systemName}`);
    }

    /**
     * @param {new (...args) => BaseHUDPart} hud
     * @param {boolean=} draw
     */
    registerHUD(hud, draw = false) {
        const hudName = hud.name;
        this[hudName] = hud;

        const id =
            hudName.replace("HUD", "").charAt(0).toLowerCase() + hudName.replace("HUD", "").substring(1);

        this.modInterface.registerHudElement(id, hud);

        if (!draw) {
            return;
        }

        this.modInterface.runAfterMethod(GameHUD, "draw", function (parameters) {
            this.parts[id].draw(parameters);
        });

        this.announcementLog(`Registered HUD ${hudName} (${id})`);
    }
}
