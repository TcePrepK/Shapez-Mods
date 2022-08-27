import { HUDBaseToolbar } from "shapez/game/hud/parts/base_toolbar";

export class HUDMathToolbar extends HUDBaseToolbar {
    constructor(root) {
        super(root, {
            primaryBuildings: [],
            secondaryBuildings: [],
            visibilityCondition: () => !this.root.camera.getIsMapOverlayActive(),
            htmlElementId: "ingame_HUD_MathGatesToolbar",
        });
    }
}
