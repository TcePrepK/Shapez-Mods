import { globalConfig } from "shapez/core/config";
import { Mod } from "shapez/mods/mod";
import { MetaCCTBuilding } from "./building";
import { CCTComponent } from "./component";
import { CCTSystem } from "./system";

class ModImpl extends Mod {
    init() {
        globalConfig["shapez"] = this;

        this.modInterface.registerComponent(CCTComponent);

        this.modInterface.registerNewBuilding({
            metaClass: MetaCCTBuilding,
        });

        this.modInterface.registerGameSystem({
            id: "CommandControllerSystem",
            systemClass: CCTSystem,

            before: "belt",
            drawHooks: ["staticAfter"],
        });

        // Add it to the regular toolbar
        this.modInterface.addNewBuildingToToolbar({
            toolbar: "regular",
            location: "primary",
            metaClass: MetaCCTBuilding,
        });

        // this.modInterface.registerHudElement("CommandControllerEdit", HUDCommandControllerEdit);
    }
}
