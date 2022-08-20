import { makeDiv } from "shapez/core/utils";
import { BaseHUDPart } from "shapez/game/hud/base_hud_part";

export class HUDFunctionBackToMenu extends BaseHUDPart {
    createElements(parent) {
        this.element = makeDiv(parent, "ingame_HUD_PuzzleBackToMenu");
        this.button = document.createElement("button");
        this.button.classList.add("button");
        this.element.appendChild(this.button);

        this.trackClicks(this.button, this.back);
    }

    initialize() {}

    back() {
        this.root.gameState.goBackToMenu();
    }
}
