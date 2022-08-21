import { globalConfig } from "shapez/core/config";
import { HUDBaseToolbar } from "shapez/game/hud/parts/base_toolbar";
import { HUDBuildingsToolbar } from "shapez/game/hud/parts/buildings_toolbar";
import { HUDWiresToolbar } from "shapez/game/hud/parts/wires_toolbar";
import { Mod } from "shapez/mods/mod";
import { ToolbarManager } from "./toolbarManager";

const toolbarManager = new ToolbarManager();
globalConfig["toolbarManager"] = toolbarManager;

shapez.ModInterface.prototype.registerToolbar = function (id, toolbar, isVisible = false) {
    if (!this.toolbarToHUD) {
        this.toolbarToHUD = {};
    }

    this.toolbarToHUD[id] = toolbar.name;
    if (id == "regular" || id == "wires") {
        return;
    }

    this.modLoader.signals.hudInitializer.add(root => {
        // @ts-ignore
        const hud = new toolbar(root);

        root.hud.parts[id] = hud;
        toolbarManager.registerToolbar(id, hud);
    });

    if (isVisible) {
        return;
    }

    this.modLoader.signals.hudElementFinalized.add(element => {
        if (element == toolbarManager.getToolbarByID(id)) {
            element.mtForceDisable();
        }
    });
};

shapez.ModInterface.prototype.registerToolbar("regular", HUDBuildingsToolbar);
shapez.ModInterface.prototype.registerToolbar("wires", HUDWiresToolbar);

shapez.ModInterface.prototype.addNewBuildingToToolbar = function ({ toolbar, location, metaClass }) {
    const hudElementName = this["toolbarToHUD"][toolbar] || "HUDBuildingsToolbar";
    const property = location === "secondary" ? "secondaryBuildings" : "primaryBuildings";

    this.modLoader.signals.hudElementInitialized.add(element => {
        if (element.constructor.name === hudElementName) {
            element[property].push(metaClass);
        }
    });
};

class ModImpl extends Mod {
    init() {
        this.modLoader.signals.hudElementInitialized.add(element => {
            if (element.constructor.name === "HUDBuildingsToolbar") {
                toolbarManager.registerToolbar("regular", element);
                return;
            }

            if (element.constructor.name === "HUDWiresToolbar") {
                toolbarManager.registerToolbar("wires", element);
                return;
            }
        });

        this.modInterface.extendClass(HUDBaseToolbar, ({ $super, $old }) => ({
            initialize() {
                this.coreCondition = this.visibilityCondition;
                this.visibilityCondition = () => this.mtForceVisible && this.coreCondition();

                this.mtForceEnable();
                $old.initialize.call(this);
            },

            mtForceToggle() {
                this.mtForceVisible = !this.mtForceVisible;
            },

            mtForceEnable() {
                this.mtForceVisible = true;
            },

            mtForceDisable() {
                this.mtForceVisible = false;
            },
        }));
    }
}
