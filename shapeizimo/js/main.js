import { GameState } from "shapez/core/game_state";
import { gGameModeRegistry } from "shapez/core/global_registries";
import { createLogger } from "shapez/core/logging";
import { GameMode } from "shapez/game/game_mode";
import { BaseHUDPart } from "shapez/game/hud/base_hud_part";
import { GameHUD } from "shapez/game/hud/hud";
import { HUDSandboxController } from "shapez/game/hud/parts/sandbox_controller";
import { Mod } from "shapez/mods/mod";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { MainMenuState } from "shapez/states/main_menu";
import { MetaFunctionBlock } from "./building/meta";
import { HUDFunctionPlacer } from "./placer/functionPlacer";
import { FunctionManager } from "./core/functionManager";
import { functionsMenuStateId } from "./core/utils";
import { FunctionsGameMode } from "./game_mode/functionsGameMode";
import { FunctionMenuState } from "./game_mode/functionsGameState";
import { HUDEnableSandbox } from "./huds/enableSandbox";
import { HUDFunctionKeyOption } from "./placer/functionKeyOption";

export const shapeizimoLogger = createLogger("shapeizimo");

class ModImpl extends Mod {
    init() {
        shapeizimoLogger.log("✨✨✨ Starting initializating shapeizimo! ✨✨✨");

        this.registerHUD(HUDEnableSandbox, false);
        this.modInterface.registerHudElement("sandboxController", HUDSandboxController);

        this.registerBuilding({ metaClass: MetaFunctionBlock, location: "secondary" });
        this.registerHUD(HUDFunctionPlacer, true);
        this.registerHUD(HUDFunctionKeyOption, false);

        // @ts-ignore
        this.registerGameMode(FunctionsGameMode);
        this.registerState(FunctionMenuState);

        this.registerKeybinding("OpenFunctionMenu", "N", "Open Function Menu", root => {
            root.gameState.moveToState(functionsMenuStateId);
        });

        this.signals.stateEntered.add(state => {
            if (!(state instanceof MainMenuState)) {
                return;
            }

            this.app.functionMgr = new FunctionManager(this.app);

            this.app.functionMgr.initialize().catch(err => {
                createLogger("shapeizimo/function/load").error("Failed to initialize functions:", err);
                alert(
                    "Your functions failed to load, it seems your data files got corrupted. I'm so sorry!\n\n(This can happen if your pc crashed while a function was saved).\n\nYou can try re-importing your functions."
                );
                return this.app.functionMgr.writeAsync();
            });
        });
    }

    /**
     * @param {Object} param0
     * @param {typeof ModMetaBuilding} param0.metaClass
     * @param {"regular"|"wires"|"both"=} param0.toolbar
     * @param {"primary"|"secondary"|"both"=} param0.location
     */
    registerBuilding({ metaClass, toolbar = "both", location = "both" }) {
        shapeizimoLogger.log("🎁 Registering building: " + metaClass.name);

        this.modInterface.registerNewBuilding({
            metaClass,
        });

        /** @type {Array<"regular"|"wires">} */
        const toolbars = toolbar == "both" ? ["regular", "wires"] : [toolbar];

        /** @type {Array<"primary"|"secondary">} */
        const locations = location == "both" ? ["primary", "secondary"] : [location];

        for (const toolbar of toolbars) {
            for (const location of locations) {
                this.modInterface.addNewBuildingToToolbar({
                    metaClass,
                    toolbar,
                    location,
                });
            }
        }
    }

    /**
     * @param {typeof BaseHUDPart} hud
     * @param {boolean} draw
     */
    registerHUD(hud, draw) {
        /** @ts-ignore @type {String} */
        const id = hud.getId();

        shapeizimoLogger.log("🎁 Registering HUD: " + id + " (draw: " + draw + ")");

        // @ts-ignore
        this.modInterface.registerHudElement(id, hud);

        if (!draw) {
            return;
        }

        this.modInterface.runAfterMethod(GameHUD, "draw", function (parameters) {
            this.parts[id].draw(parameters);
        });
    }

    /**
     * @param {String} id
     * @param {String} key
     * @param {String} translation
     * @param {(GameRoot:any) => void} action
     * @param {{shift?: boolean, alt?: boolean, ctrl?: boolean}} modifiers
     */
    registerKeybinding(id, key, translation, action, modifiers = {}) {
        shapeizimoLogger.log("🎁 Registering keybinding: " + id + " (" + key + ")");

        this.modInterface.registerIngameKeybinding({
            id,
            keyCode: shapez.keyToKeyCode(key),
            translation,
            modifiers,
            handler: action,
        });
    }

    /**
     * @param {typeof GameMode} gameMode
     */
    registerGameMode(gameMode) {
        gGameModeRegistry.register(gameMode);
    }

    /**
     * @param {typeof GameState} state
     */
    registerState(state) {
        this.signals.appBooted.add(() => {
            this.modInterface.registerGameState(state);
        });
    }
}
