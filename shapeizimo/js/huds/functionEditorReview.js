import { createLogger } from "shapez/core/logging";
import { DialogWithForm } from "shapez/core/modal_dialog_elements";
import { FormElementInput } from "shapez/core/modal_dialog_forms";
import { makeDiv } from "shapez/core/utils";
import { BaseHUDPart } from "shapez/game/hud/base_hud_part";
import { T } from "shapez/translations";
import { FunctionSerializer } from "../core/functionSerializer";
import { functionsMenuStateId } from "../core/utils";

const logger = createLogger("function-review");

export class HUDFunctionEditorReview extends BaseHUDPart {
    constructor(root) {
        super(root);
    }

    createElements(parent) {
        this.element = makeDiv(parent, "ingame_HUD_GameMenu");
        // this.button = document.createElement("button");
        // this.button.classList.add("button");
        // this.button.textContent = T.puzzleMenu.reviewPuzzle;
        // this.element.appendChild(this.button);

        this.saveButton = makeDiv(this.element, null, ["button", "save", "animEven"]);
        // this.saveButton.textContent = T.puzzleMenu.reviewPuzzle;
        this.trackClicks(this.saveButton, () => this.doSave());
    }

    initialize() {
        this.root.signals.gameSaved.add(this.onGameSaved, this);
    }

    onGameSaved() {
        this.saveButton.classList.toggle("animEven");
        this.saveButton.classList.toggle("animOdd");
    }

    doSave() {
        this.root.gameMode["doSave"]().then(() => {
            this.root.gameState.moveToState(functionsMenuStateId);
        });
    }
}
