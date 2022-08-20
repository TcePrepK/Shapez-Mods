import { BaseHUDPart } from "shapez/game/hud/base_hud_part";
import { HUDKeybindingOverlay } from "shapez/game/hud/parts/keybinding_overlay";
import { keyToKeyCode } from "shapez/game/key_action_mapper";

export class HUDFunctionPlacer extends BaseHUDPart {
    static getId() {
        return "function_placer";
    }

    initialize() {
        this.oldSelected = null;
        this.firstSelect = false;

        this.buildingPlacer = this.root.hud.parts.buildingPlacer;

        // /** @type {HUDKeybindingOverlay} */
        // const overlay = this.root.hud.parts["keybindingOverlay"];
        // overlay.keybindings.push({
        //     label: "Switch to function editor.",
        //     keys: [keyToKeyCode("N")],
        //     condition: () => true,
        // });
    }

    update() {
        const selectedMeta = this.buildingPlacer.currentMetaBuilding.get();
        if (!selectedMeta) {
            this.firstSelect = false;
            return;
        }

        if (selectedMeta != this.oldSelected) {
            this.firstSelect = false;
        }

        if (this.firstSelect) {
            return;
        }

        console.log(selectedMeta);

        this.oldSelected = selectedMeta;
        this.firstSelect = true;
    }

    draw() {
        // TODO
    }
}
