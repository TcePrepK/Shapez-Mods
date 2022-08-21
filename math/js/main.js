import { createLogger } from "shapez/core/logging";
import { Component } from "shapez/game/component";
import { GameSystem } from "shapez/game/game_system";
import { BaseHUDPart } from "shapez/game/hud/base_hud_part";
import { GameHUD } from "shapez/game/hud/hud";
import { HUDSandboxController } from "shapez/game/hud/parts/sandbox_controller";
import { Mod } from "shapez/mods/mod";
import { MODS } from "shapez/mods/modloader";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { BasicMathGates } from "./buildings/basicMath";
import { ComplexMathGates } from "./buildings/complexMath";
import { RandomNumberGenerator } from "./buildings/randomNumberGenerator";
import { SeedProvider } from "./buildings/seedProvider";
import { BasicMathComponent } from "./components/basicMath";
import { ComplexMathComponent } from "./components/complexMath";
import { RandomNumberGeneratorComponent } from "./components/randomNumberGenerator";
import { SeedProviderComponent } from "./components/seedProvider";
import { HUDEnableSandbox } from "./debug/enableSandbox";
import { BasicMathSystem } from "./systems/basicMath";
import { ComplexMathSystem } from "./systems/complexMath";
import { RandomNumberGeneratorSystem } from "./systems/randomNumberGenerator";
import { SeedProviderSystem } from "./systems/seedProvider";
import { HUDMathToolbar } from "./toolbar/mathToolbar";
import { HUDToolbarChanger } from "./toolbar/toolbarChanger";

const modLogger = createLogger("math-gates");

class ModImpl extends Mod {
    registerAllToolbars() {
        this.modLog("Registering toolbars");

        this.modInterface["registerToolbar"]("mathToolbar", HUDMathToolbar, false);
    }

    registerAllComponents() {
        this.modLog("Registering components");

        this.registerComponent(BasicMathComponent);
        this.registerComponent(ComplexMathComponent);
        this.registerComponent(SeedProviderComponent);
        this.registerComponent(RandomNumberGeneratorComponent);
    }

    registerAllBuildings() {
        this.modLog("Registering buildings");

        this.registerBuilding(BasicMathGates, ["mathToolbar"], ["primary"]);
        this.registerBuilding(ComplexMathGates, ["mathToolbar"], ["primary"]);
        this.registerBuilding(SeedProvider, ["wires", "mathToolbar"], ["secondary", "primary"]);
        this.registerBuilding(RandomNumberGenerator, ["wires", "mathToolbar"], ["secondary", "primary"]);

        RandomNumberGenerator.getAllVariantCombinations;
    }

    registerAllSystems() {
        this.modLog("Registering systems");

        this.registerSystem(BasicMathSystem, "belt");
        this.registerSystem(ComplexMathSystem, "belt");

        this.registerSystem(SeedProviderSystem, "belt");
        this.registerSystem(RandomNumberGeneratorSystem, "belt");
    }

    registerAllHUDs() {
        this.modLog("Registering HUDs");

        this.registerHUD(HUDToolbarChanger);
    }

    registerAllKeybindings() {
        // this.modInterface.registerIngameKeybinding({
        //     id: "edit_channels_toggle",
        //     keyCode: KEYCODES.F8,
        //     translation: "Toggles channel editing board.",
        //     /** @param {GameRoot} root */
        //     handler: root => {
        //         root.hud.parts["connectionBoard"].toggle();
        //         return STOP_PROPAGATION;
        //     },
        // });
    }

    runAllOverrides() {}

    setupDebugTools() {
        this.modLog("Setting up debug tools");

        this.registerHUD(HUDEnableSandbox);
        this.modInterface.registerHudElement("sandboxController", HUDSandboxController);
    }

    init() {
        if (!MODS.mods.find(x => x.metadata.id === "numbersLib")) {
            console.log(window.open("https://shapez.mod.io/number-library"));
            throw "MathGates mod requires Numbers Library mod to work! Please get that mod first.";
        }

        if (!MODS.mods.find(x => x.metadata.id === "moreToolbars")) {
            console.log(window.open("https://skimnerphi.net/mods/moreToolbars"));
            throw "MathGates mod requires More Toolbars mod to work! Please get that mod first.";
        }

        try {
            this.setupDebugTools();

            this.runAllOverrides();
            this.registerAllToolbars();
            this.registerAllComponents();
            this.registerAllBuildings();
            this.registerAllSystems();
            this.registerAllHUDs();
            this.registerAllKeybindings();
        } catch (e) {
            this.errorLog(e);
            return;
        }

        this.modLog("Mod loaded Successfully");
    }

    /**
     * @param {string} message
     */
    modLog(message) {
        modLogger.log("❎ " + message + " ❎");
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
     * @param {Array<string>} toolbar
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
                // @ts-ignore
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
