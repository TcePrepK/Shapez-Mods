import { BaseHUDPart } from "shapez/game/hud/base_hud_part";
import { HUDKeybindingOverlay } from "shapez/game/hud/parts/keybinding_overlay";
import { KEYCODES, keyToKeyCode } from "shapez/game/key_action_mapper";

export class HUDFunctionKeyOption extends BaseHUDPart {
    static getId() {
        return "function_key_option";
    }

    initialize() {
        // /** @type {HUDKeybindingOverlay} */
        // const overlay = this.root.hud.parts["keybindingOverlay"];
        // overlay.keybindings.push({
        //     // Move map - Including mouse
        //     label: "Switch to function editor.",
        //     keys: [keyToKeyCode("N")],
        //     condition: () => true,
        // });
    }

    update() {
        // TODO
    }
}
