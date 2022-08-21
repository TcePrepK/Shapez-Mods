import { makeDiv } from "shapez/core/utils";
import { MetaConstantSignalBuilding } from "shapez/game/buildings/constant_signal";
import { MetaTransistorBuilding } from "shapez/game/buildings/transistor";
import { MetaWireBuilding } from "shapez/game/buildings/wire";
import { MetaWireTunnelBuilding } from "shapez/game/buildings/wire_tunnel";
import { HUDBaseToolbar } from "shapez/game/hud/parts/base_toolbar";

export class HUDMathToolbar extends HUDBaseToolbar {
    constructor(root) {
        super(root, {
            primaryBuildings: [],
            secondaryBuildings: [
                MetaWireBuilding,
                MetaWireTunnelBuilding,
                MetaConstantSignalBuilding,
                MetaTransistorBuilding,
            ],
            visibilityCondition: () => !this.root.camera.getIsMapOverlayActive(),
            htmlElementId: "ingame_HUD_MathGatesToolbar",
        });
    }

    /**
     * Should create all require elements
     * @param {HTMLElement} parent
     */
    // @ts-ignore
    createElements(parent) {
        this.element = makeDiv(parent, this.htmlElementId, ["ingame_mathGatesToolbar"], "");
    }
}
