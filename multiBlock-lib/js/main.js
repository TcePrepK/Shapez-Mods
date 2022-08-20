import { GameHUD } from "shapez/game/hud/hud";
import { Mod } from "shapez/mods/mod";
import { MultiBlockManager } from "./multiBlockManager";

class ModImpl extends Mod {
    init() {
        this.modInterface.registerHudElement("multiBlockManager", MultiBlockManager);

        this.modInterface.runAfterMethod(GameHUD, "draw", function (parameters) {
            this.parts["multiBlockManager"].draw(parameters);
        });
    }
}
