import { globalConfig } from "shapez/core/config";
import { makeDiv } from "shapez/core/utils";
import { BaseHUDPart } from "shapez/game/hud/base_hud_part";
import { KEYMAPPINGS } from "shapez/game/key_action_mapper";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";

export class HUDToolbarChanger extends BaseHUDPart {
    static getId() {
        return "toolbarChanger";
    }

    initialize() {
        const manager = globalConfig["toolbarManager"];

        this.addChangerToToolbar(manager.getToolbarByID("wires"));
        this.addChangerToToolbar(manager.getToolbarByID("mathToolbar"));

        this.currentState = 0;

        this.root.keyMapper.getBinding(KEYMAPPINGS.ingame.switchLayers).add(this.onSwitchLayers.bind(this));
    }

    addChangerToToolbar(toolbar) {
        const rowPrimary = makeDiv(toolbar.element, null, ["toolbarChanger"]);

        const itemContainer = makeDiv(rowPrimary, null, ["building"]);
        itemContainer.setAttribute("data-icon", "building_icons/toolbar_changer.png");

        const icon = makeDiv(itemContainer, null, ["icon"]);

        this.trackClicks(icon, this.handleClick, {
            clickSound: null,
        });

        toolbar.buildingHandles["toolbarChanger"] = {
            metaBuilding: new ModMetaBuilding(""),
            element: itemContainer,
            unlocked: false,
            selected: false,
            index: 0,
            puzzleLocked: false,
        };
    }

    handleClick() {
        const manager = globalConfig["toolbarManager"];
        manager.toggleToolbar("mathToolbar");
        manager.toggleToolbar("wires");

        this.currentState = 1 - this.currentState;
    }

    onSwitchLayers() {
        if (this.currentState == 0) {
            return;
        }

        const manager = globalConfig["toolbarManager"];
        manager.toggleToolbar("mathToolbar");
    }
}
