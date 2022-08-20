import { Vector } from "shapez/core/vector";
import { enumMouseButton } from "shapez/game/camera";
import { BaseHUDPart } from "shapez/game/hud/base_hud_part";

export class HUDCommandControllerEdit extends BaseHUDPart {
    initialize() {
        this.root.camera.downPreHandler.add(this.downPreHandler, this);
    }

    /**
     * @param {Vector} pos
     * @param {enumMouseButton} button
     */
    downPreHandler(pos, button) {
        const tile = this.root.camera.screenToWorld(pos).toTileSpace();
        const contents = this.root.map.getLayerContentXY(tile.x, tile.y, "regular");
        if (contents) {
            const commandControllerComp = contents.components["CommandController"];
            if (commandControllerComp) {
                if (button === enumMouseButton.left) {
                    const oldCommand = commandControllerComp.command;
                    this.root.systemMgr.systems["commandController"].editCommandController(
                        contents,
                        oldCommand
                    );
                    return "stop_propagation";
                }
            }
        }
    }
}
