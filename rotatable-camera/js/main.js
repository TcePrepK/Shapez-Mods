import { globalConfig } from "shapez/core/config";
import { keyToKeyCode } from "shapez/game/key_action_mapper";
import { GameRoot } from "shapez/game/root";
import { Mod } from "shapez/mods/mod";
import { overrides } from "./iHateThis";

globalConfig["cameraRotation"] = 0;

class ModImpl extends Mod {
    init() {
        overrides(this.modInterface);

        this.modInterface.registerIngameKeybinding({
            id: "camera_rotation_positive",
            keyCode: keyToKeyCode("E"),
            translation: "Rotates camera clock wise.",
            modifiers: {
                shift: true,
            },
            repeated: true,
            /** @param {GameRoot} root */
            handler: root => {
                globalConfig["cameraRotation"] += Math.PI / 180;
                return shapez.STOP_PROPAGATION;
            },
        });

        this.modInterface.registerIngameKeybinding({
            id: "camera_rotation_negative",
            keyCode: keyToKeyCode("Q"),
            translation: "Rotates camera counter clock wise.",
            modifiers: {
                shift: true,
            },
            repeated: true,
            /** @param {GameRoot} root */
            handler: root => {
                globalConfig["cameraRotation"] -= Math.PI / 180;
                return shapez.STOP_PROPAGATION;
            },
        });
    }
}
