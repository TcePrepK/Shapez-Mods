import { globalConfig } from "shapez/core/config";
import { gMetaBuildingRegistry } from "shapez/core/global_registries";
import { makeDiv } from "shapez/core/utils";
import { MetaItemProducerBuilding } from "shapez/game/buildings/item_producer";
import { BaseHUDPart } from "shapez/game/hud/base_hud_part";
import { KEYMAPPINGS } from "shapez/game/key_action_mapper";

export class HUDEnableSandbox extends BaseHUDPart {
    static getId() {
        return "enableSandbox";
    }

    initialize() {
        const manager = globalConfig["toolbarManager"];

        this.addProducerToToolbar(manager.getToolbarByID("regular"));
        this.addProducerToToolbar(manager.getToolbarByID("wires"));
    }

    addProducerToToolbar(toolbar) {
        const rowPrimary = makeDiv(toolbar.element, null, ["producer"]);
        const metaBuilding = gMetaBuildingRegistry.findByClass(MetaItemProducerBuilding);

        let rawBinding = KEYMAPPINGS.buildings[metaBuilding.getId() + "_" + toolbar.layer];
        if (!rawBinding) {
            rawBinding = KEYMAPPINGS.buildings[metaBuilding.getId()];
        }

        const binding = this.root.keyMapper.getBinding(rawBinding);
        binding.add(() => toolbar.selectBuildingForPlacement(metaBuilding));

        const itemContainer = makeDiv(rowPrimary, null, ["building"]);
        itemContainer.setAttribute("data-icon", "building_icons/" + metaBuilding.getId() + ".png");
        itemContainer.setAttribute("data-id", metaBuilding.getId());

        const icon = makeDiv(itemContainer, null, ["icon"]);

        this.trackClicks(icon, () => toolbar.selectBuildingForPlacement(metaBuilding), {
            clickSound: null,
        });

        toolbar.buildingHandles[metaBuilding.id] = {
            metaBuilding: metaBuilding,
            element: itemContainer,
            unlocked: false,
            selected: false,
            index: 0,
            puzzleLocked: false,
        };
    }
}
