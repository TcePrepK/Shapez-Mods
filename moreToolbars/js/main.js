import { globalConfig } from "shapez/core/config";
import { gMetaBuildingRegistry } from "shapez/core/global_registries";
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
        root.hud.parts[id] = new toolbar(root);
        toolbarManager.registerToolbar(id, root.hud.parts[id]);
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
                this.mtForceEnable();
                $old.initialize.call(this);
            },

            update() {
                const visible = this["mtForceVisible"] && this.visibilityCondition();
                this.domAttach.update(visible);

                if (!visible) {
                    return;
                }

                let recomputeSecondaryToolbarVisibility = false;
                for (const buildingId in this.buildingHandles) {
                    const handle = this.buildingHandles[buildingId];
                    const newStatus = !handle.puzzleLocked && handle.metaBuilding.getIsUnlocked(this.root);
                    if (handle.unlocked !== newStatus) {
                        handle.unlocked = newStatus;
                        handle.element.classList.toggle("unlocked", newStatus);
                        recomputeSecondaryToolbarVisibility = true;
                    }
                }

                if (recomputeSecondaryToolbarVisibility && this.secondaryDomAttach) {
                    let anyUnlocked = false;
                    for (let i = 0; i < this.secondaryBuildings.length; ++i) {
                        const metaClass = gMetaBuildingRegistry.findByClass(this.secondaryBuildings[i]);
                        if (metaClass.getIsUnlocked(this.root)) {
                            anyUnlocked = true;
                            break;
                        }
                    }

                    this.secondaryDomAttach.update(anyUnlocked);
                }
            },

            mtForceToggle() {
                this["mtForceVisible"] = !this["mtForceVisible"];
            },

            mtForceEnable() {
                this["mtForceVisible"] = true;
            },

            mtForceDisable() {
                this["mtForceVisible"] = false;
            },
        }));

        this.modInterface.registerToolbar("regular", HUDBuildingsToolbar);
        this.modInterface.registerToolbar("wires", HUDWiresToolbar);
    }
}
