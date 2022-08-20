import { globalConfig } from "shapez/core/config";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { SeedProviderComponent } from "../components/seedProvider";

export class SeedProviderSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [SeedProviderComponent]);
    }

    update() {
        for (const entity of this.allEntities) {
            const slotComp = entity.components.WiredPins;
            slotComp.slots[0].value = globalConfig["numberManager"].getItem(this.root.map.seed);
        }
    }
}
