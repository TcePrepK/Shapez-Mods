import { globalConfig } from "shapez/core/config";
import { STOP_PROPAGATION } from "shapez/core/signal";
import { enumDirectionToVector, Vector } from "shapez/core/vector";
import { GameSystem } from "shapez/game/game_system";
import { BaseHUDPart } from "shapez/game/hud/base_hud_part";
import { GameHUD } from "shapez/game/hud/hud";
import { HUDWireInfo } from "shapez/game/hud/parts/wire_info";
import { HUDWiresOverlay } from "shapez/game/hud/parts/wires_overlay";
import { KEYCODES, KEYMAPPINGS } from "shapez/game/key_action_mapper";
import { GameLogic } from "shapez/game/logic";
import { MapChunkAggregate } from "shapez/game/map_chunk_aggregate";
import { MapChunkView } from "shapez/game/map_chunk_view";
import { GameRoot } from "shapez/game/root";
import { enumHubGoalRewards } from "shapez/game/tutorial_goals";
import { Mod } from "shapez/mods/mod";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { MOD_SIGNALS } from "shapez/mods/mod_signals";
import { MODS } from "shapez/mods/modloader";
import { MetaDisplayController } from "./buildings/displayController";
import { MetaAdvancedDisplay } from "./buildings/displayManagers";
import { MetaSignalTransportBuildings } from "./buildings/signalTransport";
import { MetaUserInputBuildings } from "./buildings/userInput";
import { DisplayControllerComponent } from "./components/displayController";
import { FiberPinsComponent } from "./components/fiberPins";
import { HammerLinkComponent } from "./components/hammerLink";
import { KeyboardReaderComponent } from "./components/keyboardReader";
import { MouseReaderComponent } from "./components/mouseReader";
import { AdvancedDisplayComponent } from "./components/wirelessDisplay";
import { DisplayManager } from "./core/displayManager";
import { DynamicRemoteElement } from "./core/dynamicRemoteElement";
import { FiberEditor } from "./core/fiberEditor";
import { FiberPinElement } from "./core/fiberPinElement";
import { removeThis } from "./remove/removeThisWhenPrSuggestionIsAccepted";
import { AdvancedDisplaySystem } from "./systems/advancedDisplay";
import { DisplayControllerSystem } from "./systems/displayController";
import { FiberPinsSystem } from "./systems/fiberPins";
import { HammerLinkSystem } from "./systems/hammerLink";
import { KeyboardReaderSystem } from "./systems/keyboardReader";
import { MouseReaderSystem } from "./systems/mouseReader";

// ipcMain.handle("fs-test", async (event, job) => {
//     const filenameSafe = job.filename;
//     // const fname = path.join(storePath, filenameSafe);
//     // switch (job.type) {
//     //     case "read": {
//     //         if (!fs.existsSync(fname)) {
//     //             // Special FILE_NOT_FOUND error code
//     //             return { error: "file_not_found" };
//     //         }
//     //         return await fs.promises.readFile(fname, "utf8");
//     //     }
//     //     case "write": {
//     //         await writeFileSafe(fname, job.contents);
//     //         return job.contents;
//     //     }

//     //     case "delete": {
//     //         await fs.promises.unlink(fname);
//     //         return;
//     //     }

//     //     default:
//     //         throw new Error("Unknown fs job: " + job.type);
//     // }
//     console.log("Test");
//     console.log(job);
// });

const modName = "Wires-Minus";
class ModImpl extends Mod {
    registerAllComponents() {
        this.registerComponent(FiberPinsComponent);

        this.registerComponent(AdvancedDisplayComponent);
        this.registerComponent(DisplayControllerComponent);

        this.registerComponent(HammerLinkComponent);

        this.registerComponent(KeyboardReaderComponent);
        this.registerComponent(MouseReaderComponent);
    }

    registerAllBuildings() {
        this.registerBuilding(MetaAdvancedDisplay, ["regular", "wires"], ["secondary", "secondary"]);
        this.registerBuilding(MetaDisplayController, ["wires"], ["secondary"]);

        this.registerBuilding(MetaSignalTransportBuildings, ["wires"], ["secondary"]);
        this.registerBuilding(MetaUserInputBuildings, ["regular", "wires"], ["secondary", "secondary"]);
    }

    registerAllSystems() {
        this.registerSystem(FiberPinsSystem, "belt");

        this.registerSystem(MouseReaderSystem, "logicGate");
        this.registerSystem(KeyboardReaderSystem, "logicGate", ["staticAfter"]);

        this.registerSystem(HammerLinkSystem, "logicGate");
        this.registerSystem(DisplayControllerSystem, "logicGate");
        this.registerSystem(AdvancedDisplaySystem, "logicGate", ["staticAfter"]);
    }

    registerAllKeybindings() {
        this.modInterface.registerIngameKeybinding({
            id: "key_reader_override_toggle",
            keyCode: KEYCODES.F7,
            translation: "Toggles override option of Key Reader.",
            /** @param {GameRoot} root */
            handler: root => {
                KeyboardReaderSystem.get(root).toggleOverride();
                return STOP_PROPAGATION;
            },
        });
    }

    runAllOverrides() {
        this.modInterface.runAfterMethod(MapChunkView, "drawWiresForegroundLayer", function (parameters) {
            AdvancedDisplaySystem.get(this.root).drawWiresChunk(parameters, this);
            HammerLinkSystem.get(this.root).drawChunk(parameters, this);
            FiberPinsSystem.get(this.root).drawChunk(parameters, this);
        });

        this.modInterface.runAfterMethod(MapChunkAggregate, "drawOverlay", function (parameters) {
            const chunkPos = new Vector(this.x, this.y).multiplyScalar(globalConfig.chunkAggregateSize);
            for (let i = 0; i < globalConfig.chunkAggregateSize; i++) {
                for (let j = 0; j < globalConfig.chunkAggregateSize; j++) {
                    const chunk = this.root.map.getChunk(chunkPos.x + i, chunkPos.y + j);
                    if (!chunk) {
                        continue;
                    }

                    AdvancedDisplaySystem.get(this.root).drawChunk(parameters, chunk);
                }
            }
        });

        this.modInterface.replaceMethod(HUDWireInfo, "drawOverlays", function ($original, [parameters]) {
            if (FiberEditor.get(this.root).isActive) {
                return;
            }

            $original(parameters);
        });

        this.modInterface.extendClass(GameLogic, ({ $old }) => ({
            computeDisplayEdgeStatus({ tile, edge }) {
                const offset = enumDirectionToVector[edge];
                const targetTile = tile.add(offset);

                const entities = this.root.map.getLayersContentsMultipleXY(targetTile.x, targetTile.y);
                for (const entity of entities) {
                    const displayComp = AdvancedDisplayComponent.get(entity);

                    if (displayComp) {
                        return true;
                    }
                }

                return false;
            },
        }));

        removeThis(this.modInterface);
    }

    setupLayerSwitcher() {
        shapez.layersToSwitch ??= [
            {
                id: "regular",
                isUnlocked: () => true,
            },
            {
                id: "wires",
                isUnlocked: root => {
                    if (!root.gameMode.getSupportsWires()) {
                        return false;
                    }
                    return root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_wires_painter_and_levers);
                },
            },
        ];

        const wiresIndex = shapez.layersToSwitch.findIndex(x => x.id === "wires");
        shapez.layersToSwitch.splice(wiresIndex + 1, 0, {
            id: "fiberEditor",
            isUnlocked: root => {
                return root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_logic_gates);
            },
            enable: root => {
                FiberEditor.get(root).toggleOn();
            },
            disable: root => {
                FiberEditor.get(root).toggleOff();
            },
        });

        this.modInterface.replaceMethod(HUDWiresOverlay, "switchLayers", function () {
            // @ts-ignore
            const reverse = this.root.keyMapper.getBinding(
                KEYMAPPINGS.placement.rotateInverseModifier
            ).pressed;

            const currLayer = this["realCurrentLayer"] || shapez.layersToSwitch[0];
            const currentIndex = shapez.layersToSwitch.findIndex(x => x == currLayer);
            const currentLayer = shapez.layersToSwitch[currentIndex];

            let index = currentIndex;
            do {
                index += reverse ? -1 : 1;
                index = (index + shapez.layersToSwitch.length) % shapez.layersToSwitch.length;

                const layer = shapez.layersToSwitch[index];
                // @ts-ignore
                if (layer.isUnlocked(this.root)) {
                    // @ts-ignore
                    currentLayer.disable?.(this.root);

                    if (layer.enable) {
                        // @ts-ignore
                        layer.enable(this.root);
                    } else {
                        // @ts-ignore
                        this.root.currentLayer = layer.id;
                    }

                    this["realCurrentLayer"] = layer;

                    return;
                }
            } while (index !== currentIndex);
        });
    }

    setupFiberEditor() {
        MOD_SIGNALS.gameInitialized.add(root => {
            new FiberEditor(root);
        });

        this.modInterface.runAfterMethod(GameHUD, "update", function (parameters) {
            FiberEditor.get(this.root).update();
        });

        this.modInterface.runAfterMethod(GameHUD, "draw", function (parameters) {
            FiberEditor.get(this.root).draw(parameters);
        });

        this.modInterface.runAfterMethod(GameHUD, "drawOverlays", function (parameters) {
            FiberEditor.get(this.root).drawOverlays(parameters);
        });

        this.signals.gameSerialized.add((root, data) => {
            data.modExtraData.wm_fibers = FiberEditor.get(root).serialize();
        });

        this.signals.gameDeserialized.add((root, data) => {
            if (data.modExtraData.wm_fibers) {
                FiberEditor.get(root).deserialize(data.modExtraData.wm_fibers);
            }
        });
    }

    setupDisplayManager() {
        MOD_SIGNALS.gameInitialized.add(root => {
            new DisplayManager(root);
        });
    }

    setupElements() {
        this.signals.appBooted.add(root => {
            const NetworkBuddy = this.dependencies["network-buddy"];

            // @ts-ignore
            NetworkBuddy.registerNetworkElement(FiberPinElement);
            // @ts-ignore
            NetworkBuddy.registerNetworkElement(DynamicRemoteElement);
        }, this);
    }

    init() {
        try {
            this.requestMods(["numbers-lib", "network-buddy", "meta-patch"]);

            this.setupLayerSwitcher();
            this.setupFiberEditor();
            this.setupElements();
            this.setupDisplayManager();

            this.runAllOverrides();
            this.registerAllComponents();
            this.registerAllBuildings();
            this.registerAllSystems();
            // this.registerAllHUDs();
            this.registerAllKeybindings();
        } catch (e) {
            console.error(e);
        }
    }

    /**
     * @param {Array<String>} mods
     */
    requestMods(mods) {
        /** @type {{ [index: String]: Mod}} */
        this.dependencies = {};
        MODS.signals.appBooted.addToTop(() => {
            MODS.mods.forEach(m => {
                const id = m.metadata.id;
                if (mods.includes(id)) {
                    this.dependencies[id] = m;
                }
            });
        });

        const modLoadList = MODS.modLoadQueue.map(x => x.meta.id);
        const missingMods = [];
        for (const mod of mods) {
            if (modLoadList.includes(mod)) {
                continue;
            }

            missingMods.push(mod);
        }

        if (missingMods.length == 0) {
            const modList = MODS.mods.map(x => x.metadata.id);

            let dependsLoaded = true;
            let highestIndex = -1;
            for (const mod of mods) {
                if (modList.includes(mod)) {
                    continue;
                }

                dependsLoaded = false;
                highestIndex = Math.max(highestIndex, modLoadList.indexOf(mod));
            }

            const thisModIDX = MODS.modLoadQueue.findIndex(x => x.modClass == ModImpl);
            const thisMod = MODS.modLoadQueue[thisModIDX];
            if (dependsLoaded) {
                const index = MODS.mods.findIndex(x => x.metadata == thisMod.meta);
                if (index != -1) {
                    MODS.mods.splice(index, 1);
                }

                return;
            }

            MODS.modLoadQueue.splice(highestIndex + 1, 0, thisMod);

            throw `Stopped loading ${modName} temporarily to let dependencies load first!`;
        }

        MODS.signals.stateEntered.add(gameState => {
            if (gameState.getKey() !== "MainMenuState") return;
            /** @type {import("shapez/game/hud/parts/modal_dialogs").HUDModalDialogs | null} */
            const dialogs = gameState["dialogs"];
            if (!dialogs) {
                return;
            }

            const title = `Missing mods for ${modName} !`;
            if (dialogs.dialogStack.some(x => x.title === title)) {
                return;
            }

            const modsText =
                `${modName} mod depends on some other mods and it looks like you are missing some of them. You can click to open them in browser. <br/>` +
                `<h4>Missing Mods</h4>` +
                missingMods
                    .map(
                        m =>
                            `• <a href=` +
                            `"https://skimnerphi.net/mods/${m.split(":").at(-1)}"` +
                            `target="_blank" rel="follow">${m}</a>`
                    )
                    .join("<br/>");

            dialogs.showWarning(title, modsText);
        });

        throw "Missing mods!";
    }

    /**
     * @param {import("shapez/game/component").StaticComponent} component
     */
    registerComponent(component) {
        const componentName = component.name;
        this[componentName] = component;

        this.modInterface.registerComponent(component);
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
    }

    /**
     * @param {new (any) => GameSystem} system
     * @param {string=} before
     * @param {Array<string>=} drawHooks
     */
    registerSystem(system, before, drawHooks = []) {
        const systemName = system.name;
        this[systemName] = system;

        // @ts-ignore
        const id = system.getId
            ? // @ts-ignore
              system.getId()
            : systemName.charAt(0).toLowerCase() + systemName.substring(1, systemName.length - 6);

        this.modInterface.registerGameSystem({
            id,
            systemClass: system,
            before,
            drawHooks,
        });
    }

    /**
     * @param {new (...args) => BaseHUDPart} hud
     */
    registerHUD(hud) {
        const hudName = hud.name;
        this[hudName] = hud;

        const id =
            hudName.replace("HUD", "").charAt(0).toLowerCase() + hudName.replace("HUD", "").substring(1);

        this.modInterface.registerHudElement(id, hud);

        if (!hud.prototype["draw"]) {
            return;
        }

        this.modInterface.runAfterMethod(GameHUD, "draw", function (parameters) {
            this.parts[id].draw(parameters);
        });
    }
}
