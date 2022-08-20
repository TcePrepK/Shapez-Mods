import { makeDiv } from "shapez/core/utils";
import { BaseHUDPart } from "shapez/game/hud/base_hud_part";
import { T } from "shapez/translations";

export class HUDFunctionEditorControls extends BaseHUDPart {
    createElements(parent) {
        this.element = makeDiv(parent, "ingame_HUD_PuzzleEditorControls");

        this.element.innerHTML = T.ingame.puzzleEditorControls.instructions
            .map(text => `<span>${text}</span>`)
            .join("");

        this.titleElement = makeDiv(parent, "ingame_HUD_PuzzleEditorTitle");
        this.titleElement.innerText = T.ingame.puzzleEditorControls.title;
    }

    initialize() {}
}
